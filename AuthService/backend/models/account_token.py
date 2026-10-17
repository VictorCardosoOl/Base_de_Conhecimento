import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import CHAR, CheckConstraint, DateTime, ForeignKey, Index, String, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class AccountTokenPurpose(StrEnum):
    PASSWORD_RESET = "password_reset"  # noqa: S105 (finalidade, não é senha)
    EMAIL_VERIFICATION = "email_verification"


class AccountToken(Base):
    """Token de uso único enviado por email: redefinição de senha ou confirmação de email.

    Só o SHA-256 é armazenado (o token tem 256 bits de entropia). `email` é o endereço para
    o qual o link foi enviado: se o email da conta mudar, o token deixa de valer.
    Cada novo pedido invalida os anteriores da mesma finalidade (ADR-0012).
    """

    __tablename__ = "account_tokens"
    __table_args__ = (
        CheckConstraint(
            "purpose IN ('password_reset', 'email_verification')", name="purpose_valid"
        ),
        Index("ix_account_tokens_user_purpose", "user_id", "purpose"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    purpose: Mapped[str] = mapped_column(String(30), nullable=False)
    token_hash: Mapped[str] = mapped_column(CHAR(64), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
