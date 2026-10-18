"""Login social: OAuth 2.0 Authorization Code com PKCE (S256) e `state` (ADR-0013).

Arquitetura extensível: cada provedor é uma subclasse de `OAuthProvider` com seus
endpoints e a leitura do perfil. Para incluir Microsoft, Facebook etc.:

1. criar a subclasse (endpoints, escopos e `fetch_profile`);
2. registrá-la em `PROVIDER_CLASSES`;
3. acrescentar OAUTH_<ID>_CLIENT_ID / OAUTH_<ID>_CLIENT_SECRET em `Settings`.

O perfil só é aceito com email verificado pelo provedor: é ele que permite vincular a
uma conta existente sem abrir espaço para sequestro (regras no OAuthService).
"""

import base64
import hashlib
import json
import secrets
import urllib.error
import urllib.parse
import urllib.request
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, ClassVar, Protocol

from backend.core.config import Settings
from backend.core.logger import get_logger

logger = get_logger(__name__)


class OAuthProviderError(Exception):
    """O provedor recusou a troca do código ou respondeu algo inesperado."""


@dataclass(frozen=True)
class SocialProfile:
    subject: str
    email: str | None
    email_verified: bool
    name: str | None
    # Sugestão de nome de usuário (ex.: login do GitHub). Só uma sugestão.
    username_hint: str | None = None


class HttpClient(Protocol):
    def post_form(self, url: str, data: dict[str, str], headers: dict[str, str]) -> Any: ...

    def get_json(self, url: str, headers: dict[str, str]) -> Any: ...


class UrllibHttpClient:
    """Cliente HTTP mínimo (biblioteca padrão), só HTTPS e com timeout."""

    def __init__(self, timeout_seconds: float = 10) -> None:
        self._timeout = timeout_seconds

    def _request(self, request: urllib.request.Request) -> Any:
        if not request.full_url.startswith("https://"):
            raise OAuthProviderError("o provedor precisa usar HTTPS")
        try:
            with urllib.request.urlopen(request, timeout=self._timeout) as response:  # noqa: S310 (só https, verificado acima)
                payload = response.read(1_000_000)
        except urllib.error.HTTPError as exc:
            raise OAuthProviderError(f"provedor respondeu {exc.code}") from exc
        except (urllib.error.URLError, TimeoutError) as exc:
            raise OAuthProviderError("provedor indisponível") from exc
        try:
            return json.loads(payload)
        except ValueError as exc:
            raise OAuthProviderError("resposta do provedor não é JSON") from exc

    def post_form(self, url: str, data: dict[str, str], headers: dict[str, str]) -> Any:
        body = urllib.parse.urlencode(data).encode()
        request = urllib.request.Request(  # noqa: S310 (esquema conferido em _request)
            url,
            data=body,
            method="POST",
            headers={"Content-Type": "application/x-www-form-urlencoded", **headers},
        )
        return self._request(request)

    def get_json(self, url: str, headers: dict[str, str]) -> Any:
        request = urllib.request.Request(url, method="GET", headers=headers)  # noqa: S310
        return self._request(request)


def generate_code_verifier() -> str:
    """PKCE (RFC 7636): 64 bytes aleatórios em base64url = 86 caracteres (43 a 128)."""
    return secrets.token_urlsafe(64)


def code_challenge_s256(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


class OAuthProvider(ABC):
    id: ClassVar[str]
    display_name: ClassVar[str]
    authorize_url: ClassVar[str]
    token_url: ClassVar[str]
    scopes: ClassVar[tuple[str, ...]]

    def __init__(self, client_id: str, client_secret: str, http: HttpClient) -> None:
        self._client_id = client_id
        self._client_secret = client_secret
        self._http = http

    def extra_authorize_params(self) -> dict[str, str]:
        return {}

    def authorization_url(self, *, state: str, code_challenge: str, redirect_uri: str) -> str:
        params = {
            "response_type": "code",
            "client_id": self._client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(self.scopes),
            "state": state,
            "code_challenge": code_challenge,
            "code_challenge_method": "S256",
            **self.extra_authorize_params(),
        }
        return f"{self.authorize_url}?{urllib.parse.urlencode(params)}"

    def exchange_code(self, code: str, code_verifier: str, redirect_uri: str) -> str:
        body = self._http.post_form(
            self.token_url,
            {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": self._client_id,
                "client_secret": self._client_secret,
                "code_verifier": code_verifier,
            },
            {"Accept": "application/json"},
        )
        token = body.get("access_token") if isinstance(body, dict) else None
        if not isinstance(token, str) or not token:
            # O corpo pode trazer detalhes do erro, mas nunca é registrado (pode ecoar o código).
            raise OAuthProviderError("troca do código recusada")
        return token

    @abstractmethod
    def fetch_profile(self, access_token: str) -> SocialProfile: ...

    def authenticate(self, code: str, code_verifier: str, redirect_uri: str) -> SocialProfile:
        return self.fetch_profile(self.exchange_code(code, code_verifier, redirect_uri))


def _str_or_none(value: object, max_length: int = 254) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()[:max_length]
    return None


class GoogleProvider(OAuthProvider):
    id = "google"
    display_name = "Google"
    authorize_url = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url = "https://oauth2.googleapis.com/token"  # noqa: S105 (URL pública)
    scopes = ("openid", "email", "profile")
    userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"

    def extra_authorize_params(self) -> dict[str, str]:
        return {"prompt": "select_account"}

    def fetch_profile(self, access_token: str) -> SocialProfile:
        data = self._http.get_json(
            self.userinfo_url,
            {"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        if not isinstance(data, dict) or not _str_or_none(data.get("sub"), 255):
            raise OAuthProviderError("perfil do Google sem identificador")
        verified = data.get("email_verified")
        return SocialProfile(
            subject=str(data["sub"]),
            email=_str_or_none(data.get("email")),
            email_verified=verified is True or verified == "true",
            name=_str_or_none(data.get("name"), 100),
        )


class GitHubProvider(OAuthProvider):
    id = "github"
    display_name = "GitHub"
    authorize_url = "https://github.com/login/oauth/authorize"
    token_url = "https://github.com/login/oauth/access_token"  # noqa: S105 (URL pública)
    scopes = ("read:user", "user:email")
    api_url = "https://api.github.com"

    def _headers(self, access_token: str) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    def fetch_profile(self, access_token: str) -> SocialProfile:
        user = self._http.get_json(f"{self.api_url}/user", self._headers(access_token))
        if not isinstance(user, dict) or not isinstance(user.get("id"), int):
            raise OAuthProviderError("perfil do GitHub sem identificador")
        # O email do perfil pode ser privado ou não verificado: vale só o principal verificado.
        emails = self._http.get_json(f"{self.api_url}/user/emails", self._headers(access_token))
        primary = (
            next(
                (
                    item
                    for item in emails
                    if isinstance(item, dict) and item.get("primary") and item.get("verified")
                ),
                None,
            )
            if isinstance(emails, list)
            else None
        )
        return SocialProfile(
            subject=str(user["id"]),
            email=_str_or_none(primary.get("email")) if primary else None,
            email_verified=primary is not None,
            name=_str_or_none(user.get("name"), 100),
            username_hint=_str_or_none(user.get("login"), 39),
        )


PROVIDER_CLASSES: dict[str, type[OAuthProvider]] = {
    GoogleProvider.id: GoogleProvider,
    GitHubProvider.id: GitHubProvider,
}


def build_providers(settings: Settings, http: HttpClient) -> dict[str, OAuthProvider]:
    """Só os provedores com client id e secret configurados ficam ativos."""
    providers: dict[str, OAuthProvider] = {}
    for provider_id, provider_class in PROVIDER_CLASSES.items():
        prefix = f"OAUTH_{provider_id.upper()}"
        client_id = getattr(settings, f"{prefix}_CLIENT_ID", None)
        secret = getattr(settings, f"{prefix}_CLIENT_SECRET", None)
        if client_id and secret is not None:
            providers[provider_id] = provider_class(client_id, secret.get_secret_value(), http)
    return providers
