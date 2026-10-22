import uuid
from datetime import datetime

from sqlalchemy import CHAR, DateTime, ForeignKey, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class RefreshToken(Base):
    """Refresh token de uma sessão. Só o SHA-256 do token é armazenado.

    `used_at` preenchido significa que o token já foi rotacionado: apresentá-lo de
    novo é reuso e revoga a sessão (família) inteira.
    """

    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(CHAR(64), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replaced_by_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("refresh_tokens.id", ondelete="SET NULL")
    )
