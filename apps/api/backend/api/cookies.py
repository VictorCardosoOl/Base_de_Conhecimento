from datetime import UTC, datetime

from fastapi import Response

from backend.core.config import Settings
from backend.services.auth_service import IssuedTokens


def _max_age(expires_at: datetime) -> int:
    return max(0, int((expires_at - datetime.now(UTC)).total_seconds()))


def set_auth_cookies(response: Response, tokens: IssuedTokens, settings: Settings) -> None:
    # Access token: Path=/ para chegar ao Next (BFF) e à Knowledge API na mesma origem.
    response.set_cookie(
        key=settings.ACCESS_COOKIE_NAME,
        value=tokens.access_token,
        max_age=_max_age(tokens.access_expires_at),
        path="/",
        domain=None
        if settings.ACCESS_COOKIE_NAME.startswith("__Host-")
        else settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )
    # Refresh token: Path restrito às rotas /auth, só trafega onde é necessário.
    response.set_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        value=tokens.refresh_token,
        max_age=_max_age(tokens.refresh_expires_at),
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )


OAUTH_COOKIE_PATH = "/auth/oauth"


def set_oauth_cookie(
    response: Response, name: str, value: str, max_age: int, settings: Settings
) -> None:
    """Cookies curtos do login social (state, cadastro pendente), só em /auth/oauth.

    SameSite=Lax sempre: o retorno do provedor é uma navegação vinda de outro site, e com
    Strict o cookie de state não chegaria ao callback.
    """
    response.set_cookie(
        key=name,
        value=value,
        max_age=max_age,
        path=OAUTH_COOKIE_PATH,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )


def clear_oauth_cookie(response: Response, name: str, settings: Settings) -> None:
    response.delete_cookie(
        key=name,
        path=OAUTH_COOKIE_PATH,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite="lax",
    )


def clear_auth_cookies(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.ACCESS_COOKIE_NAME,
        path="/",
        domain=None
        if settings.ACCESS_COOKIE_NAME.startswith("__Host-")
        else settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.delete_cookie(
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.COOKIE_DOMAIN,
        secure=settings.COOKIE_SECURE,
        httponly=True,
        samesite=settings.COOKIE_SAMESITE,
    )
