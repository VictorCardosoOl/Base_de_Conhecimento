"""Login e cadastro por provedores sociais (ADR-0013).

Fluxo: /start grava `state` + `code_verifier` (PKCE) e redireciona ao provedor; o
/callback confere o `state` (no banco e no cookie do navegador que iniciou), troca o
código e decide:

1. vínculo já existe (provedor + subject) → entra na conta vinculada;
2. o provedor não confirmou o email → recusa;
3. existe conta com o mesmo email:
   - com o email já confirmado na conta → vincula e entra (os dois lados comprovaram a
     posse do mesmo email) e avisa o titular por email;
   - com o email ainda não confirmado → recusa. Quem cadastrou esse email pode não ser o
     dono dele (pré-sequestro de conta): o titular precisa entrar com a senha e confirmar
     o email antes;
4. não existe conta → cadastro pendente: a conta só nasce depois que a pessoa escolhe o
   usuário, o nome e aceita os termos (sempre como `user`).
"""

import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal

from sqlalchemy.orm import Session

from backend.core.config import Settings
from backend.core.email import OutgoingEmail
from backend.core.email_templates import social_account_linked_email
from backend.core.errors import InvalidTokenError, NotFoundError, RateLimitedError
from backend.core.logger import get_logger
from backend.core.oauth import (
    OAuthProvider,
    OAuthProviderError,
    SocialProfile,
    code_challenge_s256,
    generate_code_verifier,
)
from backend.core.rate_limit import RateLimiter, rate_limit_key
from backend.core.reserved_usernames import is_reserved_username
from backend.core.tokens import hash_refresh_token
from backend.models.oauth import OAuthPendingSignup
from backend.models.user import USERNAME_MAX_LENGTH, Role, User
from backend.repositories.oauth_repository import OAuthRepository
from backend.repositories.user_repository import UserRepository, normalize_email
from backend.services.auth_service import AuthService, ClientInfo, IssuedTokens
from backend.services.registration import (
    AcceptedTerms,
    ProfileData,
    check_terms,
    record_terms_acceptance,
)
from backend.services.user_service import UserService, is_valid_username

logger = get_logger(__name__)

DEFAULT_NEXT_PATH = "/conta"
PENDING_EXPIRED = (
    "O cadastro com o provedor expirou ou já foi concluído. Comece de novo pelo botão do provedor."
)

OAuthErrorCode = Literal[
    "unavailable",
    "rate_limited",
    "state",
    "denied",
    "provider",
    "email_unverified",
    "link_requires_verification",
    "already_linked",
    "inactive",
    "registration_disabled",
]


class OAuthFlowError(Exception):
    """Falha do fluxo social: vira um redirecionamento para /login?erro=oauth_<code>."""

    def __init__(self, code: OAuthErrorCode) -> None:
        super().__init__(code)
        self.code: OAuthErrorCode = code


@dataclass(frozen=True)
class OAuthStart:
    redirect_url: str
    state: str


@dataclass(frozen=True)
class OAuthOutcome:
    next_path: str
    tokens: IssuedTokens | None = None
    pending_token: str | None = None
    notice: OutgoingEmail | None = None


@dataclass(frozen=True)
class PendingSignupView:
    provider: str
    provider_name: str
    email: str
    suggested_display_name: str | None
    suggested_username: str | None
    next_path: str


_CONTROL = re.compile(r"[\x00-\x1f\x7f]")


def safe_next_path(value: str | None, default: str = DEFAULT_NEXT_PATH) -> str:
    """Só caminhos internos (mesma regra do `sanitizeNextPath` da Base de Conhecimento)."""
    if (
        not value
        or len(value) > 512
        or not value.startswith("/")
        or value.startswith("//")
        or "\\" in value
        or _CONTROL.search(value)
        or value == "/auth"
        or value.startswith(("/auth/", "/auth?", "/login", "/cadastro"))
    ):
        return default
    return value


def _username_candidate(raw: str | None) -> str | None:
    if not raw:
        return None
    candidate = re.sub(r"[^a-z0-9._-]", "", raw.strip().lower())
    candidate = re.sub(r"^[^a-z0-9]+", "", candidate)[:USERNAME_MAX_LENGTH]
    return candidate if is_valid_username(candidate) else None


class OAuthService:
    def __init__(
        self,
        db: Session,
        settings: Settings,
        rate_limiter: RateLimiter,
        providers: dict[str, OAuthProvider],
    ) -> None:
        self._db = db
        self._settings = settings
        self._rate_limiter = rate_limiter
        self._providers = providers
        self._oauth = OAuthRepository(db)
        self._users = UserRepository(db)

    def enabled_providers(self) -> list[OAuthProvider]:
        return list(self._providers.values())

    def redirect_uri(self, provider_id: str) -> str:
        return f"{self._settings.PUBLIC_APP_URL}/auth/oauth/{provider_id}/callback"

    def _provider(self, provider_id: str) -> OAuthProvider:
        provider = self._providers.get(provider_id)
        if provider is None:
            raise OAuthFlowError("unavailable")
        return provider

    def _limit_ip(self, client: ClientInfo) -> None:
        result = self._rate_limiter.hit(
            rate_limit_key("oauth-ip", client.ip_address or "unknown"),
            self._settings.OAUTH_RATE_LIMIT_IP_ATTEMPTS,
            self._settings.OAUTH_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not result.allowed:
            raise OAuthFlowError("rate_limited")

    # ── Início ───────────────────────────────────────────────────────────────

    def start(self, provider_id: str, next_path: str | None, client: ClientInfo) -> OAuthStart:
        provider = self._provider(provider_id)
        self._limit_ip(client)
        state = secrets.token_urlsafe(32)
        verifier = generate_code_verifier()
        self._oauth.add_state(
            hash_refresh_token(state),
            provider.id,
            verifier,
            safe_next_path(next_path),
            datetime.now(UTC) + timedelta(seconds=self._settings.OAUTH_STATE_TTL_SECONDS),
        )
        self._db.commit()
        url = provider.authorization_url(
            state=state,
            code_challenge=code_challenge_s256(verifier),
            redirect_uri=self.redirect_uri(provider.id),
        )
        return OAuthStart(redirect_url=url, state=state)

    # ── Retorno do provedor ──────────────────────────────────────────────────

    def callback(
        self,
        provider_id: str,
        *,
        code: str | None,
        state: str | None,
        cookie_state: str | None,
        provider_error: str | None,
        client: ClientInfo,
    ) -> OAuthOutcome:
        provider = self._provider(provider_id)
        # O state precisa ser o do cookie deste navegador (impede login CSRF) e existir no
        # banco (uso único: removido agora, antes de falar com o provedor).
        if not state or not cookie_state or not secrets.compare_digest(state, cookie_state):
            raise OAuthFlowError("state")
        stored = self._oauth.pop_state(hash_refresh_token(state))
        self._db.commit()
        now = datetime.now(UTC)
        if stored is None or stored.provider != provider.id or stored.expires_at <= now:
            raise OAuthFlowError("state")
        if provider_error or not code:
            # Ex.: access_denied (a pessoa cancelou na tela do provedor).
            raise OAuthFlowError("denied")

        try:
            profile = provider.authenticate(
                code, stored.code_verifier, self.redirect_uri(provider.id)
            )
        except OAuthProviderError as exc:
            logger.warning("oauth_provider_failed provider=%s reason=%s", provider.id, exc)
            raise OAuthFlowError("provider") from exc
        return self._resolve(provider, profile, stored.next_path, client, now)

    def _resolve(
        self,
        provider: OAuthProvider,
        profile: SocialProfile,
        next_path: str,
        client: ClientInfo,
        now: datetime,
    ) -> OAuthOutcome:
        auth = AuthService(self._db, self._settings, self._rate_limiter)

        identity = self._oauth.get_identity(provider.id, profile.subject)
        if identity is not None:
            user = self._users.get_by_id(identity.user_id)
            if user is None or not user.is_active:
                raise OAuthFlowError("inactive")
            identity.last_login_at = now
            tokens = auth.start_session(user, client)
            self._db.commit()
            logger.info("oauth_login provider=%s user_id=%s", provider.id, user.id)
            return OAuthOutcome(next_path=next_path, tokens=tokens)

        if not profile.email or not profile.email_verified:
            raise OAuthFlowError("email_unverified")
        email = normalize_email(profile.email)

        user = self._users.get_by_email(email)
        if user is not None:
            return self._link_existing(auth, provider, profile, user, email, next_path, client, now)

        if not self._settings.PUBLIC_REGISTRATION_ENABLED:
            raise OAuthFlowError("registration_disabled")
        raw = secrets.token_urlsafe(32)
        self._oauth.add_pending(
            OAuthPendingSignup(
                token_hash=hash_refresh_token(raw),
                provider=provider.id,
                subject=profile.subject,
                email=email,
                suggested_name=profile.name,
                suggested_username=self._suggest_username(profile, email),
                next_path=next_path,
                expires_at=now + timedelta(seconds=self._settings.OAUTH_PENDING_SIGNUP_TTL_SECONDS),
            )
        )
        self._db.commit()
        logger.info("oauth_signup_pending provider=%s", provider.id)
        return OAuthOutcome(next_path=next_path, pending_token=raw)

    def _link_existing(
        self,
        auth: AuthService,
        provider: OAuthProvider,
        profile: SocialProfile,
        user: User,
        email: str,
        next_path: str,
        client: ClientInfo,
        now: datetime,
    ) -> OAuthOutcome:
        if not user.is_active:
            raise OAuthFlowError("inactive")
        if user.email_verified_at is None:
            # Pré-sequestro: alguém pode ter cadastrado este email sem ser o dono.
            logger.info(
                "oauth_link_refused reason=email_not_verified provider=%s user_id=%s",
                provider.id,
                user.id,
            )
            raise OAuthFlowError("link_requires_verification")
        if self._oauth.get_identity_for_user(user.id, provider.id) is not None:
            # A conta já tem outro login deste provedor (outro subject).
            raise OAuthFlowError("already_linked")

        self._oauth.add_identity(user.id, provider.id, profile.subject, email, now)
        tokens = auth.start_session(user, client)
        self._db.commit()
        logger.info("oauth_linked provider=%s user_id=%s", provider.id, user.id)
        notice = social_account_linked_email(
            user.email, provider.display_name, f"{self._settings.PUBLIC_APP_URL}/conta"
        )
        return OAuthOutcome(next_path=next_path, tokens=tokens, notice=notice)

    def _suggest_username(self, profile: SocialProfile, email: str) -> str | None:
        for raw in (profile.username_hint, email.split("@")[0]):
            candidate = _username_candidate(raw)
            if (
                candidate
                and not is_reserved_username(candidate)
                and not self._users.exists_by_username(candidate)
            ):
                return candidate
        return None

    # ── Cadastro pendente ────────────────────────────────────────────────────

    def _pending(self, raw_token: str | None, for_update: bool = False) -> OAuthPendingSignup:
        if not raw_token:
            raise InvalidTokenError(PENDING_EXPIRED)
        pending = self._oauth.get_pending(hash_refresh_token(raw_token), for_update=for_update)
        if pending is None or pending.expires_at <= datetime.now(UTC):
            raise InvalidTokenError(PENDING_EXPIRED)
        return pending

    def pending_signup(self, raw_token: str | None) -> PendingSignupView:
        pending = self._pending(raw_token)
        provider = self._providers.get(pending.provider)
        return PendingSignupView(
            provider=pending.provider,
            provider_name=provider.display_name if provider else pending.provider,
            email=pending.email,
            suggested_display_name=pending.suggested_name,
            suggested_username=pending.suggested_username,
            next_path=pending.next_path,
        )

    def cancel_pending(self, raw_token: str | None) -> None:
        if not raw_token:
            return
        pending = self._oauth.get_pending(hash_refresh_token(raw_token), for_update=True)
        if pending is not None:
            self._oauth.delete_pending(pending)
            self._db.commit()

    def complete_signup(
        self,
        raw_token: str | None,
        *,
        username: str,
        display_name: str,
        terms: AcceptedTerms,
        profile: ProfileData,
        client: ClientInfo,
    ) -> tuple[IssuedTokens, str]:
        """Cria a conta (sempre `user`), vincula o provedor e abre a sessão."""
        if not self._settings.PUBLIC_REGISTRATION_ENABLED:
            raise NotFoundError()
        result = self._rate_limiter.hit(
            rate_limit_key("register-ip", client.ip_address or "unknown"),
            self._settings.REGISTER_RATE_LIMIT_IP_ATTEMPTS,
            self._settings.REGISTER_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not result.allowed:
            raise RateLimitedError(result.retry_after_seconds)

        pending = self._pending(raw_token, for_update=True)
        check_terms(self._settings, terms)
        if self._oauth.get_identity(pending.provider, pending.subject) is not None:
            self._oauth.delete_pending(pending)
            self._db.commit()
            raise InvalidTokenError(PENDING_EXPIRED)

        provider, subject, email, next_path = (
            pending.provider,
            pending.subject,
            pending.email,
            pending.next_path,
        )
        user = UserService(self._db).create_user(
            email,
            None,
            Role.USER,
            username=username,
            display_name=display_name,
            allow_reserved_username=False,
            email_verified=True,  # o provedor confirmou o email
            organization=profile.organization,
            professional_area=profile.professional_area,
        )
        now = datetime.now(UTC)
        self._oauth.add_identity(user.id, provider, subject, email, now)
        record_terms_acceptance(self._db, self._settings, user, terms, "oauth", client.ip_address)
        leftover = self._oauth.get_pending(hash_refresh_token(raw_token or ""), for_update=True)
        if leftover is not None:
            self._oauth.delete_pending(leftover)
        tokens = AuthService(self._db, self._settings, self._rate_limiter).start_session(
            user, client
        )
        self._db.commit()
        logger.info("oauth_signup_completed provider=%s user_id=%s", provider, user.id)
        return tokens, next_path
