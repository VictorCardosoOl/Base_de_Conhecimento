import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, CheckConstraint, DateTime, String, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base, TimestampMixin


class Role(StrEnum):
    ADMIN = "admin"  # gerencia usuários e conteúdo
    EDITOR = "editor"  # cria e edita conteúdo; não gerencia usuários
    USER = "user"  # apenas consulta


# Usuário: identificador público, único, usado em buscas e referências. Gravado já em
# minúsculas; o formato (e por consequência a forma canônica) é garantido também no banco.
USERNAME_MIN_LENGTH = 3
USERNAME_MAX_LENGTH = 30
USERNAME_PATTERN = r"^[a-z0-9][a-z0-9._-]{2,29}$"
DISPLAY_NAME_MAX_LENGTH = 100
ORGANIZATION_MAX_LENGTH = 120


class ProfessionalArea(StrEnum):
    """Área de atuação (opcional): orienta quais módulos da base são mais relevantes."""

    SEGURANCA_TRABALHO = "seguranca_trabalho"
    SAUDE_OCUPACIONAL = "saude_ocupacional"
    RH_DP = "rh_dp"
    CONTABIL_FINANCEIRO = "contabil_financeiro"
    JURIDICO = "juridico"
    TI = "ti"
    GESTAO = "gestao"
    OUTRA = "outra"


_AREAS_SQL = ", ".join(f"'{area.value}'" for area in ProfessionalArea)


class User(TimestampMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'editor', 'user')", name="role_valid"),
        CheckConstraint("email = lower(btrim(email))", name="email_normalized"),
        CheckConstraint(f"username ~ '{USERNAME_PATTERN}'", name="username_format"),
        CheckConstraint("length(btrim(display_name)) > 0", name="display_name_not_blank"),
        CheckConstraint(
            f"professional_area IS NULL OR professional_area IN ({_AREAS_SQL})",
            name="professional_area_valid",
        ),
        CheckConstraint(
            "organization IS NULL OR length(btrim(organization)) > 0",
            name="organization_not_blank",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    # Normalizado (trim + minúsculas) antes de gravar; a constraint garante isso no banco.
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(USERNAME_MAX_LENGTH), unique=True, nullable=False)
    # Nome de exibição: livre, sem unicidade.
    display_name: Mapped[str] = mapped_column(String(DISPLAY_NAME_MAX_LENGTH), nullable=False)
    # Nulo em contas criadas por login social que ainda não definiram senha.
    password_hash: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default=Role.USER.value, server_default=Role.USER.value
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default=text("true")
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Senha definida por um administrador (criação ou redefinição): o usuário deve trocá-la.
    must_change_password: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )
    # Quando a posse do email foi comprovada (link de confirmação, redefinição de senha
    # ou provedor social com email verificado). Nulo = não confirmado.
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # Perfil complementar, opcional (minimização da LGPD; ADR-0014).
    organization: Mapped[str | None] = mapped_column(String(ORGANIZATION_MAX_LENGTH))
    professional_area: Mapped[str | None] = mapped_column(String(40))

    @property
    def email_verified(self) -> bool:
        return self.email_verified_at is not None

    @property
    def has_password(self) -> bool:
        return self.password_hash is not None
