import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, Field

from backend.models.content import (
    ARTICLE_ID_MAX_LENGTH,
    ARTICLE_ID_PATTERN,
    COMMENT_MAX_LENGTH,
    COMMENT_MIN_LENGTH,
    CORRECTION_DESCRIPTION_MAX_LENGTH,
    CORRECTION_DESCRIPTION_MIN_LENGTH,
    CORRECTION_EXCERPT_MAX_LENGTH,
    RESOLUTION_NOTE_MAX_LENGTH,
    CorrectionKind,
    CorrectionStatus,
)
from backend.schemas.user_schemas import StrictModel

ArticleId = Annotated[
    str,
    Field(
        min_length=1,
        max_length=ARTICLE_ID_MAX_LENGTH,
        pattern=ARTICLE_ID_PATTERN,
        description="Identificador público do artigo (slug da URL).",
    ),
]


def _strip(value: object) -> object:
    return value.strip() if isinstance(value, str) else value


def _strip_or_none(value: object) -> object:
    if isinstance(value, str):
        value = value.strip()
        return value or None
    return value


CommentBody = Annotated[
    str,
    BeforeValidator(_strip),
    Field(min_length=COMMENT_MIN_LENGTH, max_length=COMMENT_MAX_LENGTH),
]


# ── Avaliação ────────────────────────────────────────────────────────────────


class RatingRequest(StrictModel):
    value: int = Field(ge=1, le=5, strict=True, description="Nota inteira de 1 a 5.")


class RatingSummary(BaseModel):
    average: float | None = Field(description="Média com uma casa decimal; nulo sem votos.")
    count: int
    # Quantos votos em cada nota, de 1 a 5 (posição 0 = nota 1).
    distribution: list[int]


class ArticleSummary(BaseModel):
    article_id: str
    rating: RatingSummary
    my_rating: int | None = Field(description="Nota de quem pergunta (nulo sem sessão ou voto).")
    comment_count: int


# ── Sugestão de correção ─────────────────────────────────────────────────────


class CorrectionRequest(StrictModel):
    kind: CorrectionKind
    description: Annotated[
        str,
        BeforeValidator(_strip),
        Field(
            min_length=CORRECTION_DESCRIPTION_MIN_LENGTH,
            max_length=CORRECTION_DESCRIPTION_MAX_LENGTH,
            description="O que está errado e, se souber, qual seria o correto.",
        ),
    ]
    excerpt: Annotated[
        Annotated[str, Field(max_length=CORRECTION_EXCERPT_MAX_LENGTH)] | None,
        BeforeValidator(_strip_or_none),
        Field(description="Trecho do artigo afetado (opcional)."),
    ] = None


class CorrectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    article_id: str
    kind: CorrectionKind
    description: str
    excerpt: str | None
    status: CorrectionStatus
    created_at: datetime
    resolved_at: datetime | None
    resolution_note: str | None


class CorrectionReviewOut(CorrectionOut):
    """Sugestão na fila de revisão: com quem enviou (nulo se a conta foi removida)."""

    author_username: str | None
    author_display_name: str | None
    resolver_display_name: str | None


class CorrectionListResponse(BaseModel):
    items: list[CorrectionReviewOut]
    total: int
    limit: int
    offset: int


class ResolveCorrectionRequest(StrictModel):
    status: Literal[CorrectionStatus.RESOLVED, CorrectionStatus.REJECTED]
    note: Annotated[
        Annotated[str, Field(max_length=RESOLUTION_NOTE_MAX_LENGTH)] | None,
        BeforeValidator(_strip_or_none),
        Field(description="Observação da revisão (opcional)."),
    ] = None


# ── Comentários ──────────────────────────────────────────────────────────────


class CommentRequest(StrictModel):
    body: CommentBody
    parent_id: uuid.UUID | None = Field(
        default=None, description="Comentário respondido (somente comentários de primeiro nível)."
    )


class EditCommentRequest(StrictModel):
    body: CommentBody


class CommentAuthor(BaseModel):
    username: str
    display_name: str
    role: str


class CommentOut(BaseModel):
    id: uuid.UUID
    article_id: str
    parent_id: uuid.UUID | None
    # Nulos quando o comentário foi removido (fica só o lugar, para manter as respostas).
    body: str | None
    author: CommentAuthor | None
    created_at: datetime
    edited_at: datetime | None
    deleted: bool
    can_edit: bool
    can_delete: bool
    replies: list["CommentOut"] = Field(default_factory=list)


class CommentListResponse(BaseModel):
    items: list[CommentOut]
    total: int = Field(description="Comentários visíveis no artigo (raiz e respostas).")


class ModerationCommentOut(BaseModel):
    id: uuid.UUID
    article_id: str
    parent_id: uuid.UUID | None
    body: str
    author: CommentAuthor
    created_at: datetime
    edited_at: datetime | None


class ModerationCommentListResponse(BaseModel):
    items: list[ModerationCommentOut]
    total: int
    limit: int
    offset: int
