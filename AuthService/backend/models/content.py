"""Interações com os artigos da Base de Conhecimento: avaliações, sugestões de correção
e comentários (ADR-0015).

O conteúdo dos artigos vive no repositório da Base (Markdown); aqui ficam só as
interações, referenciadas pelo identificador público do artigo (o slug da URL).
"""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, TimestampMixin

# Mesmo formato dos identificadores do catálogo da Base (ex.: "esocial-guia-completo").
ARTICLE_ID_PATTERN = r"^[a-z0-9][a-z0-9-]{0,119}$"
ARTICLE_ID_MAX_LENGTH = 120

COMMENT_MIN_LENGTH = 2
COMMENT_MAX_LENGTH = 2000
CORRECTION_DESCRIPTION_MIN_LENGTH = 10
CORRECTION_DESCRIPTION_MAX_LENGTH = 2000
CORRECTION_EXCERPT_MAX_LENGTH = 1000
RESOLUTION_NOTE_MAX_LENGTH = 500


class CorrectionKind(StrEnum):
    ERRO = "erro"  # informação errada
    DESATUALIZADO = "desatualizado"  # norma, prazo ou leiaute mudou
    INCONSISTENCIA = "inconsistencia"  # contradiz outro trecho ou artigo
    OUTRO = "outro"


class CorrectionStatus(StrEnum):
    OPEN = "open"
    RESOLVED = "resolved"
    REJECTED = "rejected"


_KINDS_SQL = ", ".join(f"'{kind.value}'" for kind in CorrectionKind)
_STATUS_SQL = ", ".join(f"'{status.value}'" for status in CorrectionStatus)


class ArticleRating(TimestampMixin, Base):
    """Uma nota (1 a 5) por pessoa por artigo; votar de novo altera a nota."""

    __tablename__ = "article_ratings"
    __table_args__ = (
        CheckConstraint("value BETWEEN 1 AND 5", name="value_range"),
        CheckConstraint(f"article_id ~ '{ARTICLE_ID_PATTERN}'", name="article_id_format"),
        UniqueConstraint("article_id", "user_id", name="uq_article_ratings_article_user"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    article_id: Mapped[str] = mapped_column(String(ARTICLE_ID_MAX_LENGTH), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    value: Mapped[int] = mapped_column(SmallInteger, nullable=False)


class ArticleCorrection(Base):
    """Sugestão de correção enviada por um leitor e revisada por editor ou admin."""

    __tablename__ = "article_corrections"
    __table_args__ = (
        CheckConstraint(f"kind IN ({_KINDS_SQL})", name="kind_valid"),
        CheckConstraint(f"status IN ({_STATUS_SQL})", name="status_valid"),
        CheckConstraint(f"article_id ~ '{ARTICLE_ID_PATTERN}'", name="article_id_format"),
        CheckConstraint(
            f"length(btrim(description)) BETWEEN {CORRECTION_DESCRIPTION_MIN_LENGTH} "
            f"AND {CORRECTION_DESCRIPTION_MAX_LENGTH}",
            name="description_length",
        ),
        CheckConstraint(
            f"excerpt IS NULL OR length(excerpt) <= {CORRECTION_EXCERPT_MAX_LENGTH}",
            name="excerpt_length",
        ),
        Index("ix_article_corrections_status_created", "status", "created_at"),
        Index("ix_article_corrections_article", "article_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    article_id: Mapped[str] = mapped_column(String(ARTICLE_ID_MAX_LENGTH), nullable=False)
    # A sugestão continua na fila mesmo se a conta de quem enviou for removida.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL")
    )
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=CorrectionStatus.OPEN.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL")
    )
    resolution_note: Mapped[str | None] = mapped_column(String(RESOLUTION_NOTE_MAX_LENGTH))


class ArticleComment(Base):
    """Comentário em um artigo; respostas têm um nível só (parent_id aponta a um raiz).

    Exclusão é lógica (deleted_at): uma resposta não perde o contexto quando o
    comentário original sai, e a moderação fica registrada (deleted_by).
    """

    __tablename__ = "article_comments"
    __table_args__ = (
        CheckConstraint(f"article_id ~ '{ARTICLE_ID_PATTERN}'", name="article_id_format"),
        CheckConstraint(
            f"length(btrim(body)) BETWEEN {COMMENT_MIN_LENGTH} AND {COMMENT_MAX_LENGTH}",
            name="body_length",
        ),
        Index("ix_article_comments_article_created", "article_id", "created_at"),
        Index("ix_article_comments_created", "created_at"),
        Index("ix_article_comments_parent", "parent_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    article_id: Mapped[str] = mapped_column(String(ARTICLE_ID_MAX_LENGTH), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("article_comments.id", ondelete="CASCADE")
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL")
    )
