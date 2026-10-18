import ipaddress
from collections.abc import Callable
from functools import lru_cache

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from backend.core.config import Settings, get_settings
from backend.core.database import get_db, get_engine
from backend.core.email import EmailSender, build_email_sender
from backend.core.errors import (
    ForbiddenError,
    PasswordChangeRequiredError,
    SessionExpiredError,
    UnauthorizedError,
)
from backend.core.logger import get_logger
from backend.core.oauth import OAuthProvider, UrllibHttpClient, build_providers
from backend.core.rate_limit import PostgresRateLimiter, RateLimiter
from backend.core.tokens import (
    AccessTokenClaims,
    TokenError,
    TokenExpiredError,
    decode_access_token,
)
from backend.models.user import Role, User
from backend.services.account_service import AccountService
from backend.services.auth_service import AuthService, ClientInfo
from backend.services.content_service import ContentService
from backend.services.oauth_service import OAuthService
from backend.services.role_request_service import RoleRequestService
from backend.services.user_service import UserService

logger = get_logger(__name__)


@lru_cache
def get_rate_limiter() -> RateLimiter:
    return PostgresRateLimiter(get_engine())


@lru_cache
def get_email_sender() -> EmailSender:
    return build_email_sender(get_settings())


@lru_cache
def get_oauth_providers() -> dict[str, OAuthProvider]:
    return build_providers(get_settings(), UrllibHttpClient())


def get_client_info(request: Request, settings: Settings = Depends(get_settings)) -> ClientInfo:
    ip = request.client.host if request.client else None
    if settings.TRUSTED_PROXY_COUNT > 0:
        # Com N proxies confiáveis, o IP do cliente é o N-ésimo a partir do fim.
        forwarded = [
            part.strip()
            for part in request.headers.get("x-forwarded-for", "").split(",")
            if part.strip()
        ]
        if len(forwarded) >= settings.TRUSTED_PROXY_COUNT:
            candidate = _valid_ip(forwarded[-settings.TRUSTED_PROXY_COUNT])
            if candidate is not None:
                ip = candidate
            else:
                # Valor que não é IP: não vira chave de limite nem vai para o banco.
                logger.warning("client_ip_forwarded_invalid peer=%s", ip)
    return ClientInfo(ip_address=ip, user_agent=request.headers.get("user-agent"))


def _valid_ip(value: str) -> str | None:
    """Forma canônica do IP (v4 ou v6), ou None se o valor não for um IP."""
    try:
        return str(ipaddress.ip_address(value))
    except ValueError:
        return None


def get_auth_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
) -> AuthService:
    return AuthService(db, settings, rate_limiter)


def get_account_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
) -> AccountService:
    return AccountService(db, settings, rate_limiter)


def get_oauth_service(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
    providers: dict[str, OAuthProvider] = Depends(get_oauth_providers),
) -> OAuthService:
    return OAuthService(db, settings, rate_limiter, providers)


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def get_role_request_service(db: Session = Depends(get_db)) -> RoleRequestService:
    return RoleRequestService(db)


def get_content_service(
    db: Session = Depends(get_db),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
) -> ContentService:
    return ContentService(db, rate_limiter)


def read_access_token(request: Request, settings: Settings) -> str | None:
    """Bearer (clientes não-navegador) tem precedência; senão, o cookie HttpOnly."""
    authorization = request.headers.get("authorization", "")
    scheme, _, credentials = authorization.partition(" ")
    if scheme.lower() == "bearer" and credentials:
        return credentials.strip()
    return request.cookies.get(settings.ACCESS_COOKIE_NAME)


def get_access_claims(
    request: Request, settings: Settings = Depends(get_settings)
) -> AccessTokenClaims:
    token = read_access_token(request, settings)
    if not token:
        raise UnauthorizedError()
    try:
        return decode_access_token(token)
    except TokenExpiredError as exc:
        raise SessionExpiredError() from exc
    except TokenError as exc:
        raise UnauthorizedError() from exc


def get_optional_access_claims(
    request: Request, settings: Settings = Depends(get_settings)
) -> AccessTokenClaims | None:
    token = read_access_token(request, settings)
    if not token:
        return None
    try:
        return decode_access_token(token)
    except TokenError:
        return None


def get_current_user(
    claims: AccessTokenClaims = Depends(get_access_claims),
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    return auth_service.resolve_user(claims)


def get_optional_user(
    claims: AccessTokenClaims | None = Depends(get_optional_access_claims),
    auth_service: AuthService = Depends(get_auth_service),
) -> User | None:
    """Leitura pública que muda com a sessão (ex.: "minha nota", "posso editar").

    Sessão ausente, vencida ou revogada vale como visitante: nunca bloqueia a leitura.
    """
    if claims is None:
        return None
    try:
        return auth_service.resolve_user(claims)
    except UnauthorizedError:
        return None


def get_active_user(user: User = Depends(get_current_user)) -> User:
    """Usuário autenticado que pode agir.

    Com a troca de senha pendente (senha definida por um administrador, que a conhece), só
    a própria troca, a leitura e sair são aceitos. Antes, só a Base de Conhecimento impunha
    isso; as rotas chamadas direto pelo navegador (/content) e a API administrativa aceitavam
    a sessão aberta com a senha temporária.
    """
    if user.must_change_password:
        raise PasswordChangeRequiredError()
    return user


def require_role(*roles: Role) -> Callable[[User], User]:
    """Autorização no servidor: o papel vem do banco, nunca do cliente."""

    allowed = {role.value for role in roles}

    def dependency(user: User = Depends(get_active_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError()
        return user

    return dependency
