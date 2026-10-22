import re
import unicodedata
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import and_, func, select, true
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session, aliased

from backend.core.errors import (
    ConflictError,
    FieldValidationError,
    ForbiddenError,
    NotFoundError,
    RateLimitedError,
)
from backend.core.logger import get_logger
from backend.core.rate_limit import RateLimiter, rate_limit_key
from backend.models.content import (
    ArticleComment,
    ArticleCorrection,
    ArticleRating,
    CorrectionKind,
    CorrectionStatus,
)
from backend.models.user import Role, User
from backend.schemas.content_schemas import (
    ArticleSummary,
    CommentAuthor,
    CommentOut,
    CorrectionReviewOut,
    ModerationCommentOut,
    RatingSummary,
)

logger = get_logger(__name__)

MODERATOR_ROLES = frozenset({Role.ADMIN.value, Role.EDITOR.value})

# Limites por pessoa (janela fixa). Generosos para uso normal, curtos para robôs.
COMMENT_LIMIT, COMMENT_WINDOW = 5, 10 * 60
COMMENT_EDIT_LIMIT, COMMENT_EDIT_WINDOW = 20, 10 * 60
CORRECTION_LIMIT, CORRECTION_WINDOW = 5, 60 * 60
RATING_LIMIT, RATING_WINDOW = 30, 10 * 60

MAX_LINKS_PER_COMMENT = 2
DUPLICATE_WINDOW = timedelta(hours=24)
MAX_COMMENTS_PER_ARTICLE_PAGE = 100

_LINK = re.compile(r"(https?://|www\.)", re.IGNORECASE)
_BLANK_LINES = re.compile(r"\n{3,}")


def is_moderator(user: User | None) -> bool:
    return user is not None and user.role in MODERATOR_ROLES


def clean_text(value: str) -> str:
    """Texto puro e previsível: sem caracteres de controle (exceto quebra de linha e
    tabulação), quebras normalizadas e no máximo uma linha em branco seguida.

    Não há HTML: o cliente exibe o texto escapado. Isto só tira o que não é texto.
    """
    value = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    value = "".join(
        char
        for char in value
        if char in "\n\t" or unicodedata.category(char) not in {"Cc", "Cf", "Co", "Cs"}
    )
    return _BLANK_LINES.sub("\n\n", value).strip()


@dataclass(frozen=True)
class _CommentRow:
    comment: ArticleComment
    username: str
    display_name: str
    role: str


class ContentService:
    """Avaliações, sugestões de correção e comentários dos artigos (ADR-0015).

    Toda escrita exige sessão; papéis vêm do banco. Moderação (fila de correções,
    remoção de comentários de outras pessoas) é de editores e admins.
    """

    def __init__(self, db: Session, rate_limiter: RateLimiter) -> None:
        self._db = db
        self._rate_limiter = rate_limiter

    # ── Limites ──────────────────────────────────────────────────────────────

    def _throttle(self, action: str, user: User, limit: int, window: int) -> None:
        result = self._rate_limiter.hit(
            rate_limit_key("content", action, str(user.id)), limit, window
        )
        if not result.allowed:
            logger.warning("content_rate_limited action=%s user_id=%s", action, user.id)
            raise RateLimitedError(result.retry_after_seconds)

    # ── Avaliação ────────────────────────────────────────────────────────────

    def summary(self, article_id: str, viewer: User | None) -> ArticleSummary:
        rows = self._db.execute(
            select(ArticleRating.value, func.count())
            .where(ArticleRating.article_id == article_id)
            .group_by(ArticleRating.value)
        ).all()
        distribution = [0] * 5
        for value, count in rows:
            distribution[value - 1] = count
        total = sum(distribution)
        average = (
            round(sum((i + 1) * n for i, n in enumerate(distribution)) / total, 1)
            if total
            else None
        )
        my_rating = None
        if viewer is not None:
            my_rating = self._db.scalar(
                select(ArticleRating.value).where(
                    ArticleRating.article_id == article_id, ArticleRating.user_id == viewer.id
                )
            )
        comment_count = (
            self._db.scalar(
                select(func.count())
                .select_from(ArticleComment)
                .where(ArticleComment.article_id == article_id, ArticleComment.deleted_at.is_(None))
            )
            or 0
        )
        return ArticleSummary(
            article_id=article_id,
            rating=RatingSummary(average=average, count=total, distribution=distribution),
            my_rating=my_rating,
            comment_count=comment_count,
        )

    def rate(self, user: User, article_id: str, value: int) -> ArticleSummary:
        self._throttle("rating", user, RATING_LIMIT, RATING_WINDOW)
        # Upsert: votar de novo troca a nota (a constraint única garante um voto por pessoa).
        self._db.execute(
            insert(ArticleRating)
            .values(article_id=article_id, user_id=user.id, value=value)
            .on_conflict_do_update(
                constraint="uq_article_ratings_article_user",
                set_={"value": value, "updated_at": func.now()},
            )
        )
        self._db.commit()
        logger.info("article_rated article_id=%s user_id=%s", article_id, user.id)
        return self.summary(article_id, user)

    def remove_rating(self, user: User, article_id: str) -> ArticleSummary:
        rating = self._db.scalar(
            select(ArticleRating).where(
                ArticleRating.article_id == article_id, ArticleRating.user_id == user.id
            )
        )
        if rating is not None:
            self._db.delete(rating)
            self._db.commit()
        return self.summary(article_id, user)

    # ── Sugestão de correção ─────────────────────────────────────────────────

    def suggest_correction(
        self,
        user: User,
        article_id: str,
        kind: CorrectionKind,
        description: str,
        excerpt: str | None,
    ) -> ArticleCorrection:
        description = clean_text(description)
        excerpt = clean_text(excerpt) if excerpt else None
        if len(description) < 10:
            raise FieldValidationError("description", "Descreva a correção com mais detalhes.")
        self._throttle("correction", user, CORRECTION_LIMIT, CORRECTION_WINDOW)

        duplicate = self._db.scalar(
            select(ArticleCorrection.id).where(
                ArticleCorrection.article_id == article_id,
                ArticleCorrection.user_id == user.id,
                ArticleCorrection.status == CorrectionStatus.OPEN.value,
                ArticleCorrection.description == description,
            )
        )
        if duplicate is not None:
            raise ConflictError("Você já enviou esta sugestão; ela está em revisão.", "description")

        correction = ArticleCorrection(
            article_id=article_id,
            user_id=user.id,
            kind=kind.value,
            description=description,
            excerpt=excerpt or None,
        )
        self._db.add(correction)
        self._db.commit()
        logger.info(
            "correction_suggested correction_id=%s article_id=%s user_id=%s",
            correction.id,
            article_id,
            user.id,
        )
        return correction

    def list_corrections(
        self, status: CorrectionStatus | None, limit: int, offset: int
    ) -> tuple[list[CorrectionReviewOut], int]:
        author = aliased(User)
        resolver = aliased(User)
        condition = ArticleCorrection.status == status.value if status else true()
        total = (
            self._db.scalar(select(func.count()).select_from(ArticleCorrection).where(condition))
            or 0
        )
        # Abertas: as mais antigas primeiro (fila). Decididas: as mais recentes primeiro.
        order = (
            (ArticleCorrection.created_at, ArticleCorrection.id)
            if status == CorrectionStatus.OPEN
            else (ArticleCorrection.created_at.desc(), ArticleCorrection.id)
        )
        rows = self._db.execute(
            select(
                ArticleCorrection,
                author.username,
                author.display_name,
                resolver.display_name,
            )
            .outerjoin(author, author.id == ArticleCorrection.user_id)
            .outerjoin(resolver, resolver.id == ArticleCorrection.resolved_by)
            .where(condition)
            .order_by(*order)
            .limit(limit)
            .offset(offset)
        ).all()
        items = [
            CorrectionReviewOut(
                id=row[0].id,
                article_id=row[0].article_id,
                kind=CorrectionKind(row[0].kind),
                description=row[0].description,
                excerpt=row[0].excerpt,
                status=CorrectionStatus(row[0].status),
                created_at=row[0].created_at,
                resolved_at=row[0].resolved_at,
                resolution_note=row[0].resolution_note,
                author_username=row[1],
                author_display_name=row[2],
                resolver_display_name=row[3],
            )
            for row in rows
        ]
        return items, total

    def resolve_correction(
        self,
        actor: User,
        correction_id: uuid.UUID,
        status: CorrectionStatus,
        note: str | None,
    ) -> ArticleCorrection:
        correction = self._db.scalar(
            select(ArticleCorrection).where(ArticleCorrection.id == correction_id).with_for_update()
        )
        if correction is None:
            raise NotFoundError("Sugestão não encontrada")
        if correction.status != CorrectionStatus.OPEN.value:
            raise ConflictError("Esta sugestão já foi revisada")
        correction.status = status.value
        correction.resolved_at = datetime.now(UTC)
        correction.resolved_by = actor.id
        correction.resolution_note = clean_text(note) if note else None
        self._db.commit()
        logger.info(
            "correction_reviewed correction_id=%s status=%s actor_id=%s",
            correction.id,
            status.value,
            actor.id,
        )
        return correction

    def corrections_by(self, user: User, limit: int = 20) -> list[ArticleCorrection]:
        return list(
            self._db.scalars(
                select(ArticleCorrection)
                .where(ArticleCorrection.user_id == user.id)
                .order_by(ArticleCorrection.created_at.desc())
                .limit(limit)
            )
        )

    # ── Comentários ──────────────────────────────────────────────────────────

    def list_comments(
        self, article_id: str, viewer: User | None, limit: int, offset: int
    ) -> tuple[list[CommentOut], int]:
        rows = [
            _CommentRow(*row)
            for row in self._db.execute(
                select(ArticleComment, User.username, User.display_name, User.role)
                .join(User, User.id == ArticleComment.user_id)
                .where(ArticleComment.article_id == article_id)
                .order_by(ArticleComment.created_at, ArticleComment.id)
            ).all()
        ]
        replies: dict[uuid.UUID, list[_CommentRow]] = {}
        roots: list[_CommentRow] = []
        for row in rows:
            if row.comment.parent_id is None:
                roots.append(row)
            elif row.comment.deleted_at is None:
                replies.setdefault(row.comment.parent_id, []).append(row)

        visible_roots = [
            row
            for row in reversed(roots)  # mais recentes primeiro
            if row.comment.deleted_at is None or replies.get(row.comment.id)
        ]
        total = sum(1 for row in rows if row.comment.deleted_at is None)
        page = visible_roots[offset : offset + limit]
        return [
            self._comment_out(
                row, viewer, [self._comment_out(r, viewer) for r in replies.get(row.comment.id, [])]
            )
            for row in page
        ], total

    def add_comment(
        self, user: User, article_id: str, body: str, parent_id: uuid.UUID | None
    ) -> CommentOut:
        body = self._valid_body(body)
        if parent_id is not None:
            parent = self._db.get(ArticleComment, parent_id)
            if parent is None or parent.article_id != article_id or parent.deleted_at is not None:
                raise FieldValidationError("parent_id", "O comentário respondido não existe mais.")
            if parent.parent_id is not None:
                raise FieldValidationError("parent_id", "Responda ao comentário original.")
        self._throttle("comment", user, COMMENT_LIMIT, COMMENT_WINDOW)

        since = datetime.now(UTC) - DUPLICATE_WINDOW
        duplicate = self._db.scalar(
            select(ArticleComment.id).where(
                and_(
                    ArticleComment.article_id == article_id,
                    ArticleComment.user_id == user.id,
                    ArticleComment.deleted_at.is_(None),
                    ArticleComment.created_at >= since,
                    ArticleComment.body == body,
                )
            )
        )
        if duplicate is not None:
            raise ConflictError("Você já publicou este comentário.", "body")

        comment = ArticleComment(
            article_id=article_id, user_id=user.id, parent_id=parent_id, body=body
        )
        self._db.add(comment)
        self._db.commit()
        logger.info(
            "comment_created comment_id=%s article_id=%s user_id=%s",
            comment.id,
            article_id,
            user.id,
        )
        return self._comment_out(
            _CommentRow(comment, user.username, user.display_name, user.role), user
        )

    def edit_comment(self, user: User, comment_id: uuid.UUID, body: str) -> CommentOut:
        comment = self._live_comment(comment_id)
        if comment.user_id != user.id:
            raise ForbiddenError("Só quem escreveu pode editar o comentário")
        body = self._valid_body(body)
        self._throttle("comment-edit", user, COMMENT_EDIT_LIMIT, COMMENT_EDIT_WINDOW)
        if body != comment.body:
            comment.body = body
            comment.edited_at = datetime.now(UTC)
            self._db.commit()
            logger.info("comment_edited comment_id=%s user_id=%s", comment.id, user.id)
        return self._comment_out(
            _CommentRow(comment, user.username, user.display_name, user.role), user
        )

    def delete_comment(self, user: User, comment_id: uuid.UUID) -> None:
        comment = self._live_comment(comment_id)
        own = comment.user_id == user.id
        if not own and not is_moderator(user):
            raise ForbiddenError("Você não pode remover este comentário")
        comment.deleted_at = datetime.now(UTC)
        comment.deleted_by = user.id
        self._db.commit()
        logger.info(
            "comment_deleted comment_id=%s actor_id=%s moderation=%s",
            comment.id,
            user.id,
            not own,
        )

    def recent_comments(self, limit: int, offset: int) -> tuple[list[ModerationCommentOut], int]:
        live = ArticleComment.deleted_at.is_(None)
        total = self._db.scalar(select(func.count()).select_from(ArticleComment).where(live)) or 0
        rows = self._db.execute(
            select(ArticleComment, User.username, User.display_name, User.role)
            .join(User, User.id == ArticleComment.user_id)
            .where(live)
            .order_by(ArticleComment.created_at.desc(), ArticleComment.id)
            .limit(limit)
            .offset(offset)
        ).all()
        return [
            ModerationCommentOut(
                id=row[0].id,
                article_id=row[0].article_id,
                parent_id=row[0].parent_id,
                body=row[0].body,
                author=CommentAuthor(username=row[1], display_name=row[2], role=row[3]),
                created_at=row[0].created_at,
                edited_at=row[0].edited_at,
            )
            for row in rows
        ], total

    # ── Auxiliares ───────────────────────────────────────────────────────────

    @staticmethod
    def _valid_body(body: str) -> str:
        body = clean_text(body)
        if len(body) < 2:
            raise FieldValidationError("body", "Escreva um comentário.")
        if len(_LINK.findall(body)) > MAX_LINKS_PER_COMMENT:
            raise FieldValidationError(
                "body", f"Use no máximo {MAX_LINKS_PER_COMMENT} links por comentário."
            )
        return body

    def _live_comment(self, comment_id: uuid.UUID) -> ArticleComment:
        comment = self._db.scalar(
            select(ArticleComment).where(ArticleComment.id == comment_id).with_for_update()
        )
        if comment is None or comment.deleted_at is not None:
            raise NotFoundError("Comentário não encontrado")
        return comment

    @staticmethod
    def _comment_out(
        row: _CommentRow, viewer: User | None, replies: list[CommentOut] | None = None
    ) -> CommentOut:
        comment = row.comment
        deleted = comment.deleted_at is not None
        own = viewer is not None and viewer.id == comment.user_id
        return CommentOut(
            id=comment.id,
            article_id=comment.article_id,
            parent_id=comment.parent_id,
            body=None if deleted else comment.body,
            author=None
            if deleted
            else CommentAuthor(username=row.username, display_name=row.display_name, role=row.role),
            created_at=comment.created_at,
            edited_at=None if deleted else comment.edited_at,
            deleted=deleted,
            can_edit=own and not deleted,
            can_delete=(own or is_moderator(viewer)) and not deleted,
            replies=replies or [],
        )
