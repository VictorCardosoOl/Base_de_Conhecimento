import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field, model_validator

from backend.core.passwords import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH
from backend.models.user import (
    DISPLAY_NAME_MAX_LENGTH,
    ORGANIZATION_MAX_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    USERNAME_PATTERN,
    ProfessionalArea,
    Role,
)
from backend.repositories.user_repository import normalize_username


def _normalize_username(value: object) -> object:
    return normalize_username(value) if isinstance(value, str) else value


def _strip(value: object) -> object:
    return value.strip() if isinstance(value, str) else value


def _strip_or_none(value: object) -> object:
    if isinstance(value, str):
        return value.strip() or None
    return value


Username = Annotated[
    str,
    BeforeValidator(_normalize_username),
    Field(
        min_length=USERNAME_MIN_LENGTH,
        max_length=USERNAME_MAX_LENGTH,
        pattern=USERNAME_PATTERN,
        description=(
            f"Identificador único, de {USERNAME_MIN_LENGTH} a {USERNAME_MAX_LENGTH} caracteres: "
            "letras minúsculas sem acento, números, ponto, hífen e sublinhado; começa com "
            "letra ou número. Maiúsculas são convertidas."
        ),
    ),
]
DisplayName = Annotated[
    str,
    BeforeValidator(_strip),
    Field(
        min_length=1,
        max_length=DISPLAY_NAME_MAX_LENGTH,
        description="Nome de exibição (livre, não precisa ser único).",
    ),
]


Organization = Annotated[
    # O limite vale para o texto; em branco vira nulo antes da validação.
    Annotated[str, Field(max_length=ORGANIZATION_MAX_LENGTH)] | None,
    BeforeValidator(_strip_or_none),
    Field(description="Organização ou empresa (opcional)."),
]
# Token de link enviado por email ou de cadastro social: 256 bits em base64url.
OpaqueToken = Annotated[str, Field(min_length=20, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")]


class StrictModel(BaseModel):
    # Campos desconhecidos são rejeitados: nada de mass assignment (ex.: "role" no login).
    model_config = ConfigDict(extra="forbid")


class LoginRequest(StrictModel):
    email: str = Field(min_length=3, max_length=254)
    # No login não se valida a política de senha, para não revelar regras nem usuários.
    password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)


def _password_field(description: str) -> str:
    return Field(  # type: ignore[no-any-return]
        min_length=PASSWORD_MIN_LENGTH,
        max_length=PASSWORD_MAX_LENGTH,
        description=(
            f"{description} Entre {PASSWORD_MIN_LENGTH} e {PASSWORD_MAX_LENGTH} caracteres."
        ),
    )


class CreateUserRequest(StrictModel):
    email: EmailStr = Field(max_length=254)
    username: Username
    display_name: DisplayName
    password: str = _password_field("Senha inicial; o usuário deverá trocá-la no primeiro acesso.")
    role: Role = Role.USER


class UpdateUserRequest(StrictModel):
    role: Role | None = None
    is_active: bool | None = None

    @model_validator(mode="after")
    def _at_least_one_field(self) -> "UpdateUserRequest":
        if self.role is None and self.is_active is None:
            raise ValueError("informe role e/ou is_active")
        return self


class ResetPasswordRequest(StrictModel):
    password: str = _password_field(
        "Senha temporária; o usuário deverá trocá-la no próximo acesso."
    )


class TermsAndProfileFields(StrictModel):
    """Aceite obrigatório dos termos (versões vigentes) e perfil complementar opcional."""

    accept_terms: Literal[True] = Field(
        description="Aceite dos Termos de Uso e da Política de Privacidade (obrigatório)."
    )
    terms_version: str = Field(min_length=1, max_length=20, description="Versão dos Termos lida.")
    privacy_version: str = Field(
        min_length=1, max_length=20, description="Versão da Política de Privacidade lida."
    )
    organization: Organization = None
    professional_area: ProfessionalArea | None = Field(
        default=None, description="Área de atuação (opcional)."
    )


class RegisterRequest(TermsAndProfileFields):
    """Cadastro público. Não aceita `role`: toda conta nova nasce como `user`."""

    email: EmailStr = Field(max_length=254)
    password: str = _password_field("Senha da nova conta.")
    username: Username
    display_name: DisplayName


class SocialSignupRequest(TermsAndProfileFields):
    """Conclusão do cadastro por login social: o email vem do provedor (já verificado)."""

    username: Username
    display_name: DisplayName


class ForgotPasswordRequest(StrictModel):
    email: EmailStr = Field(max_length=254)


class PasswordResetConfirmRequest(StrictModel):
    token: OpaqueToken
    new_password: str = _password_field("Nova senha.")


class VerifyEmailRequest(StrictModel):
    token: OpaqueToken


class MessageResponse(BaseModel):
    message: str


class OAuthProviderOut(BaseModel):
    id: str
    name: str


class OAuthProvidersResponse(BaseModel):
    providers: list[OAuthProviderOut]


class PendingSocialSignupOut(BaseModel):
    provider: str
    provider_name: str
    email: str
    suggested_display_name: str | None
    suggested_username: str | None


class UsernameAvailabilityResponse(BaseModel):
    """`available=false` quando o formato é inválido (`reason=invalid`) ou já existe (`taken`)."""

    username: str
    available: bool
    reason: str | None = None


class ChangePasswordRequest(StrictModel):
    # A senha atual não passa pela política (pode ser anterior a ela); só limita o tamanho.
    current_password: str = Field(min_length=1, max_length=PASSWORD_MAX_LENGTH)
    new_password: str = _password_field("Nova senha.")


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    username: str
    display_name: str
    role: Role
    must_change_password: bool
    email_verified: bool
    # False em contas de login social que ainda não definiram senha.
    has_password: bool


class AdminUserOut(UserOut):
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None


class RoleRequestOut(BaseModel):
    """Situação do pedido do próprio usuário para virar editor."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    requested_role: Role
    status: str
    created_at: datetime
    decided_at: datetime | None


class AdminRoleRequestOut(RoleRequestOut):
    user_id: uuid.UUID
    email: str
    username: str
    display_name: str


class RoleRequestListResponse(BaseModel):
    items: list[AdminRoleRequestOut]
    total: int
    limit: int
    offset: int


class UserListResponse(BaseModel):
    items: list[AdminUserOut]
    total: int
    limit: int
    offset: int


class AuthResponse(BaseModel):
    """Resposta de login/refresh. Os tokens vão só em cookies HttpOnly, nunca no corpo."""

    user: UserOut
    access_token_expires_at: datetime


class SocialSignupResponse(AuthResponse):
    # Para onde levar a pessoa depois do cadastro (caminho interno, já validado).
    next_path: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[dict[str, str]] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody


class Jwk(BaseModel):
    kty: str
    crv: str
    x: str
    kid: str
    use: str
    alg: str


class JwksResponse(BaseModel):
    keys: list[Jwk]


class HealthResponse(BaseModel):
    status: str
    database: str
