import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class TermsAcceptance(Base):
    """Registro do aceite dos Termos de Uso e da Política de Privacidade (ADR-0014).

    Uma linha por aceite: quando os documentos mudarem de versão, um novo aceite vira
    uma nova linha e o histórico continua disponível como prova do consentimento.
    O IP é guardado só com CONSENT_RECORD_IP=true.
    """

    __tablename__ = "terms_acceptances"
    __table_args__ = (CheckConstraint("method IN ('password', 'oauth')", name="method_valid"),)

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    terms_version: Mapped[str] = mapped_column(String(20), nullable=False)
    privacy_version: Mapped[str] = mapped_column(String(20), nullable=False)
    # Como a conta foi criada: cadastro com senha ou por login social.
    method: Mapped[str] = mapped_column(String(20), nullable=False)
    accepted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(String(45))
