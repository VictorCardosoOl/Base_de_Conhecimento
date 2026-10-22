from collections.abc import Awaitable, Callable
from urllib.parse import urlsplit

from fastapi import Request, Response
from fastapi.responses import JSONResponse

from backend.core.config import Environment, Settings
from backend.core.errors import ErrorCode
from backend.core.logger import get_logger

logger = get_logger(__name__)

_UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
_API_PREFIXES = ("/auth", "/admin", "/content", "/.well-known", "/health", "/openapi.json")

CallNext = Callable[[Request], Awaitable[Response]]


def _origin_of(url: str) -> str | None:
    parts = urlsplit(url)
    if not parts.scheme or not parts.netloc:
        return None
    return f"{parts.scheme}://{parts.netloc}"


def make_csrf_origin_middleware(
    settings: Settings,
) -> Callable[[Request, CallNext], Awaitable[Response]]:
    """Defesa CSRF para autenticação por cookie.

    Requisições que alteram estado precisam vir de uma origem confiável quando o
    navegador informa a origem (Origin, ou Referer como alternativa). Requisições
    que carregam cookies de autenticação sem nenhuma origem são recusadas.
    Clientes não-navegador (CLI, serviços) usam Bearer e não enviam cookies.
    SameSite=Lax nos cookies é a primeira camada; esta é a segunda.
    """

    auth_cookies = {settings.ACCESS_COOKIE_NAME, settings.REFRESH_COOKIE_NAME}
    trusted = set(settings.TRUSTED_ORIGINS)

    async def middleware(request: Request, call_next: CallNext) -> Response:
        if request.method in _UNSAFE_METHODS:
            origin = request.headers.get("origin")
            if origin is None and (referer := request.headers.get("referer")):
                origin = _origin_of(referer)
            carries_auth_cookie = any(name in request.cookies for name in auth_cookies)

            rejected = (origin is not None and origin.rstrip("/") not in trusted) or (
                origin is None and carries_auth_cookie
            )
            if rejected:
                logger.warning(
                    "csrf_origin_rejected method=%s path=%s origin=%s",
                    request.method,
                    request.url.path,
                    origin,
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error": {"code": ErrorCode.FORBIDDEN, "message": "Origem não permitida"}
                    },
                )
        return await call_next(request)

    return middleware


def make_security_headers_middleware(
    settings: Settings,
) -> Callable[[Request, CallNext], Awaitable[Response]]:
    async def middleware(request: Request, call_next: CallNext) -> Response:
        response = await call_next(request)
        headers = response.headers
        headers.setdefault("X-Content-Type-Options", "nosniff")
        headers.setdefault("X-Frame-Options", "DENY")
        headers.setdefault("Referrer-Policy", "no-referrer")
        headers.setdefault("Cross-Origin-Opener-Policy", "same-origin")
        headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        if request.url.path.startswith(_API_PREFIXES):
            # Respostas da API: nada executável e, exceto o JWKS, nada em cache.
            headers.setdefault(
                "Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'"
            )
            headers.setdefault("Cache-Control", "no-store")
        if settings.ENVIRONMENT is Environment.PRODUCTION:
            headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

    return middleware
