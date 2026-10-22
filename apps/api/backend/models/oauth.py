import uuid
from datetime import datetime

from sqlalchemy import CHAR, DateTime, ForeignKey, Index, String, Uuid, func, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class OAuthIdentity(Base):
    """Conta de um provedor social (Google, GitHub...) vinculada a um usuário (ADR-0013).

    `subject` é o identificador estável do provedor (nunca o email, que pode mudar).
    Um vínculo por provedor e por usuário; um mesmo `subject` só pertence a um usuário.
    """

    __tablename__ = "oauth_identities"
    __table_args__ = (
        Index("ux_oauth_identities_provider_subject", "provider", "subject", unique=True),
        Index("ux_oauth_identities_user_provider", "user_id", "provider", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    # Email informado (e verificado) pelo provedor no momento do vínculo.
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class OAuthLoginState(Base):
    """Início de um login social: `state` (anti-CSRF) e o `code_verifier` do PKCE.

    Guardado pelo hash do `state`; o mesmo valor vai num cookie HttpOnly do navegador que
    iniciou o fluxo. Uso único: removido no callback, com sucesso ou não.
    """

    __tablename__ = "oauth_states"

    state_hash: Mapped[str] = mapped_column(CHAR(64), primary_key=True)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    code_verifier: Mapped[str] = mapped_column(String(128), nullable=False)
    next_path: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )


class OAuthPendingSignup(Base):
    """Cadastro por login social aguardando usuário, nome e aceite dos termos.

    A conta só é criada (e a sessão aberta) quando a pessoa conclui essa etapa. Guardado
    pelo hash do token, que vai num cookie HttpOnly.
    """

    __tablename__ = "oauth_pending_signups"

    token_hash: Mapped[str] = mapped_column(CHAR(64), primary_key=True)
    provider: Mapped[str] = mapped_column(String(30), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(254), nullable=False)
    suggested_name: Mapped[str | None] = mapped_column(String(100))
    suggested_username: Mapped[str | None] = mapped_column(String(30))
    next_path: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
