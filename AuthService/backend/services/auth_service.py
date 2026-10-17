import hashlib
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from backend.core.config import Settings
from backend.core.email import OutgoingEmail
from backend.core.errors import (
    InvalidCredentialsError,
    NotFoundError,
    RateLimitedError,
    SessionExpiredError,
    UnauthorizedError,
    ValidationFailedError,
)
from backend.core.logger import get_logger
from backend.core.passwords import (
    hash_password,
    needs_rehash,
    verify_against_dummy,
    verify_password,
)
from backend.core.rate_limit import RateLimiter, rate_limit_key
from backend.core.tokens import (
    AccessTokenClaims,
    generate_refresh_token,
    hash_refresh_token,
    issue_access_token,
)
from backend.models.refresh_token import RefreshToken
from backend.models.session import UserSession
from backend.models.user import ProfessionalArea, Role, User
from backend.repositories.session_repository import RefreshTokenRepository, SessionRepository
from backend.repositories.user_repository import UserRepository, normalize_email
from backend.services.account_service import AccountService
from backend.services.registration import (
    AcceptedTerms,
    check_terms,
    record_terms_acceptance,
)
from backend.services.user_service import UserService

logger = get_logger(__name__)


class RevocationReason:
    LOGOUT = "logout"
    LOGOUT_ALL = "logout_all"
    REFRESH_REUSE = "refresh_token_reuse"
    USER_INACTIVE = "user_inactive"
    PASSWORD_CHANGED = "password_changed"  # noqa: S105 (motivo de revogação, não é senha)


@dataclass(frozen=True)
class IssuedTokens:
    user: User
    access_token: str
    access_expires_at: datetime
    refresh_token: str
    refresh_expires_at: datetime


@dataclass(frozen=True)
class ClientInfo:
    ip_address: str | None
    user_agent: str | None


def _email_fingerprint(email: str) -> str:
    """Identificador estável para logs sem expor o email."""
    return hashlib.sha256(normalize_email(email).encode()).hexdigest()[:12]


class AuthService:
    def __init__(self, db: Session, settings: Settings, rate_limiter: RateLimiter) -> None:
        self._db = db
        self._settings = settings
        self._rate_limiter = rate_limiter
        self._users = UserRepository(db)
        self._sessions = SessionRepository(db)
        self._refresh_tokens = RefreshTokenRepository(db)

    # ── Login ────────────────────────────────────────────────────────────────

    def login(self, email: str, password: str, client: ClientInfo) -> IssuedTokens:
        limits = self._login_rate_limits(email, client.ip_address)
        self._enforce_login_rate_limit(email, limits)
        try:
            user = self._authenticate(email, password)
        except InvalidCredentialsError:
            # Só as falhas contam: um login correto não consome o limite (D1, ADR-0016).
            for key, limit, window in limits:
                self._rate_limiter.hit(key, limit, window)
            raise

        now = datetime.now(UTC)
        if user.password_hash and needs_rehash(user.password_hash):
            user.password_hash = hash_password(password)
        tokens, session = self._open_session(user, client, now)
        self._db.commit()
        logger.info("login_succeeded user_id=%s session_id=%s", user.id, session.id)
        return tokens

    def _authenticate(self, email: str, password: str) -> User:
        """Confere as credenciais; qualquer falha é o mesmo 401 genérico."""
        user = self._users.get_by_email(email)
        if user is None:
            verify_against_dummy(password)
            logger.info("login_failed reason=unknown_email email_fp=%s", _email_fingerprint(email))
            raise InvalidCredentialsError()

        if user.password_hash is None:
            # Conta criada por login social, sem senha definida: mesma resposta e mesmo custo.
            verify_against_dummy(password)
            logger.info("login_failed reason=no_password user_id=%s", user.id)
            raise InvalidCredentialsError()

        if not verify_password(user.password_hash, password):
            logger.info("login_failed reason=wrong_password user_id=%s", user.id)
            raise InvalidCredentialsError()

        if not user.is_active:
            logger.info("login_failed reason=inactive_user user_id=%s", user.id)
            raise InvalidCredentialsError()
        return user

    def start_session(self, user: User, client: ClientInfo) -> IssuedTokens:
        """Abre uma sessão para um usuário já autenticado por outro meio (login social).

        Não faz commit: quem chama confirma junto com o restante da operação.
        """
        tokens, _ = self._open_session(user, client, datetime.now(UTC))
        return tokens

    def _open_session(
        self, user: User, client: ClientInfo, now: datetime
    ) -> tuple[IssuedTokens, UserSession]:
        user.last_login_at = now
        session = self._sessions.add(
            user_id=user.id,
            expires_at=now + timedelta(seconds=self._settings.SESSION_MAX_LIFETIME_SECONDS),
            user_agent=client.user_agent,
            ip_address=client.ip_address,
        )
        tokens, _ = self._issue_tokens(user, session, now)
        return tokens, session

    # ── Cadastro público ─────────────────────────────────────────────────────

    def register(
        self,
        email: str,
        password: str,
        username: str,
        display_name: str,
        client: ClientInfo,
        *,
        terms: AcceptedTerms,
        organization: str | None = None,
        professional_area: ProfessionalArea | None = None,
    ) -> tuple[IssuedTokens, OutgoingEmail | None]:
        """Cria uma conta `user` (nunca outro papel) e já abre a sessão (ADR-0010).

        Exige o aceite das versões vigentes dos termos, que fica registrado (ADR-0014), e
        devolve o email de confirmação do endereço, enviado em segundo plano (ADR-0012).
        Desligado por padrão (PUBLIC_REGISTRATION_ENABLED): nesse caso a rota não existe.
        """
        if not self._settings.PUBLIC_REGISTRATION_ENABLED:
            raise NotFoundError()
        result = self._rate_limiter.hit(
            rate_limit_key("register-ip", client.ip_address or "unknown"),
            self._settings.REGISTER_RATE_LIMIT_IP_ATTEMPTS,
            self._settings.REGISTER_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not result.allowed:
            logger.warning("register_rate_limited ip=%s", client.ip_address)
            raise RateLimitedError(result.retry_after_seconds)

        check_terms(self._settings, terms)
        user = UserService(self._db).create_user(
            email,
            password,
            Role.USER,
            username=username,
            display_name=display_name,
            allow_reserved_username=False,
            organization=organization,
            professional_area=professional_area,
        )
        record_terms_acceptance(
            self._db, self._settings, user, terms, "password", client.ip_address
        )
        tokens, session = self._open_session(user, client, datetime.now(UTC))
        verification = AccountService(
            self._db, self._settings, self._rate_limiter
        ).prepare_email_verification(user)
        self._db.commit()
        logger.info("user_registered user_id=%s session_id=%s", user.id, session.id)
        return tokens, verification

    def username_available(self, username: str, client: ClientInfo) -> tuple[bool, str | None]:
        """Consulta usada pelos formulários de cadastro, limitada por IP (evita varredura)."""
        result = self._rate_limiter.hit(
            rate_limit_key("username-check-ip", client.ip_address or "unknown"),
            self._settings.USERNAME_CHECK_RATE_LIMIT_ATTEMPTS,
            self._settings.USERNAME_CHECK_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not result.allowed:
            raise RateLimitedError(result.retry_after_seconds)
        return UserService(self._db).username_available(username)

    def _login_rate_limits(
        self, email: str, ip_address: str | None
    ) -> tuple[tuple[str, int, int], ...]:
        ip = ip_address or "unknown"
        settings = self._settings
        window = settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS
        account = normalize_email(email)
        return (
            (rate_limit_key("login-ip", ip), settings.LOGIN_RATE_LIMIT_IP_ATTEMPTS, window),
            (
                rate_limit_key("login-ip-email", ip, account),
                settings.LOGIN_RATE_LIMIT_ATTEMPTS,
                window,
            ),
            # Independente do IP: trocar (ou forjar) o IP não reinicia a contagem da conta.
            # Vale também para emails inexistentes, para não revelar quais existem.
            (
                rate_limit_key("login-account", account),
                settings.LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS,
                settings.LOGIN_RATE_LIMIT_ACCOUNT_WINDOW_SECONDS,
            ),
        )

    def _enforce_login_rate_limit(
        self, email: str, limits: tuple[tuple[str, int, int], ...]
    ) -> None:
        """Recusa antes de conferir a senha: durante o bloqueio, nem a senha correta passa.

        Consulta sem contar; quem conta é a falha (em `login`). Consulta e contagem não são
        atômicas: tentativas simultâneas podem passar alguns pontos do limite (risco aceito,
        ADR-0016).
        """
        for key, limit, key_window in limits:
            result = self._rate_limiter.peek(key, limit, key_window)
            if not result.allowed:
                logger.warning("login_rate_limited email_fp=%s", _email_fingerprint(email))
                raise RateLimitedError(result.retry_after_seconds)

    # ── Refresh (rotação + detecção de reuso) ────────────────────────────────

    def refresh(self, raw_refresh_token: str | None, client: ClientInfo) -> IssuedTokens:
        if not raw_refresh_token:
            raise UnauthorizedError()

        token = self._refresh_tokens.get_by_hash_for_update(hash_refresh_token(raw_refresh_token))
        if token is None:
            raise UnauthorizedError()

        session = self._sessions.get_for_update(token.session_id)
        if session is None:
            raise UnauthorizedError()

        now = datetime.now(UTC)
        concurrent = False
        if token.used_at is not None:
            if session.revoked_at is None and self._is_concurrent_refresh(token, now):
                # Outra aba acabou de rotacionar este mesmo token (ADR-0008): não é roubo.
                concurrent = True
                logger.info(
                    "refresh_concurrent_within_grace session_id=%s user_id=%s",
                    session.id,
                    session.user_id,
                )
            else:
                # Token já rotacionado reapresentado fora da janela: possível roubo.
                if session.revoked_at is None:
                    self._sessions.revoke(session, RevocationReason.REFRESH_REUSE, now)
                    self._db.commit()
                    logger.warning(
                        "refresh_token_reuse_detected session_id=%s user_id=%s ip=%s",
                        session.id,
                        session.user_id,
                        client.ip_address,
                    )
                raise UnauthorizedError()

        if session.revoked_at is not None:
            raise UnauthorizedError()
        if token.expires_at <= now or session.expires_at <= now:
            raise SessionExpiredError()

        user = self._users.get_by_id(session.user_id)
        if user is None or not user.is_active:
            self._sessions.revoke(session, RevocationReason.USER_INACTIVE, now)
            self._db.commit()
            raise UnauthorizedError()

        tokens, new_token = self._issue_tokens(user, session, now)
        if not concurrent:
            # No caminho concorrente o token já foi rotacionado; used_at e o sucessor original
            # são preservados para que a janela conte a partir da primeira rotação.
            token.used_at = now
            token.replaced_by_id = new_token.id
        session.last_used_at = now
        self._db.commit()
        logger.info("refresh_succeeded session_id=%s user_id=%s", session.id, user.id)
        return tokens

    def _is_concurrent_refresh(self, token: RefreshToken, now: datetime) -> bool:
        """Reapresentação do token imediatamente anterior, dentro da janela de tolerância.

        Só vale se o sucessor ainda não foi usado: se o cliente legítimo já avançou
        mais uma rotação, reapresentar o token antigo é tratado como reuso.
        """
        grace = self._settings.REFRESH_REUSE_GRACE_SECONDS
        if grace <= 0 or token.used_at is None:
            return False
        if (now - token.used_at).total_seconds() > grace:
            return False
        if token.replaced_by_id is None:
            return False
        successor = self._refresh_tokens.get(token.replaced_by_id)
        return successor is not None and successor.used_at is None

    def _issue_tokens(
        self, user: User, session: UserSession, now: datetime
    ) -> tuple[IssuedTokens, RefreshToken]:
        refresh_token = generate_refresh_token()
        refresh_expires_at = min(
            now + timedelta(seconds=self._settings.REFRESH_TOKEN_TTL_SECONDS), session.expires_at
        )
        record = self._refresh_tokens.add(
            session.id, hash_refresh_token(refresh_token), refresh_expires_at
        )
        access_token, access_expires_at = issue_access_token(
            user.id, Role(user.role), session.id, now
        )
        tokens = IssuedTokens(
            user=user,
            access_token=access_token,
            access_expires_at=access_expires_at,
            refresh_token=refresh_token,
            refresh_expires_at=refresh_expires_at,
        )
        return tokens, record

    # ── Logout ───────────────────────────────────────────────────────────────

    def logout(self, raw_refresh_token: str | None, claims: AccessTokenClaims | None) -> None:
        """Idempotente: sem sessão identificável, não faz nada (e não é erro)."""
        now = datetime.now(UTC)
        session: UserSession | None = None
        if raw_refresh_token:
            token = self._refresh_tokens.get_by_hash_for_update(
                hash_refresh_token(raw_refresh_token)
            )
            if token is not None:
                session = self._sessions.get_for_update(token.session_id)
        if session is None and claims is not None:
            session = self._sessions.get_for_update(claims.session_id)

        if session is not None and session.revoked_at is None:
            self._sessions.revoke(session, RevocationReason.LOGOUT, now)
            self._db.commit()
            logger.info("logout session_id=%s user_id=%s", session.id, session.user_id)

    def logout_all(self, user: User) -> int:
        revoked = self._sessions.revoke_all_for_user(
            user.id, RevocationReason.LOGOUT_ALL, datetime.now(UTC)
        )
        self._db.commit()
        logger.info("logout_all user_id=%s sessions_revoked=%s", user.id, revoked)
        return revoked

    # ── Troca da própria senha ───────────────────────────────────────────────

    def change_password(
        self,
        user: User,
        current_session_id: uuid.UUID,
        current_password: str,
        new_password: str,
    ) -> int:
        """Troca a senha do próprio usuário e encerra as demais sessões dele.

        A sessão atual continua válida. Tentativas com a senha atual errada contam no
        mesmo limite do login por usuário, para não virar um atalho de força bruta.
        """
        result = self._rate_limiter.hit(
            rate_limit_key("password-change", str(user.id)),
            self._settings.LOGIN_RATE_LIMIT_ATTEMPTS,
            self._settings.LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        )
        if not result.allowed:
            logger.warning("password_change_rate_limited user_id=%s", user.id)
            raise RateLimitedError(result.retry_after_seconds)

        if user.password_hash is None:
            raise ValidationFailedError(
                'Sua conta ainda não tem senha. Use "Esqueceu a senha?" na tela de login '
                "para criar uma."
            )
        if not verify_password(user.password_hash, current_password):
            logger.info("password_change_failed reason=wrong_current user_id=%s", user.id)
            raise ValidationFailedError("Senha atual incorreta")
        if verify_password(user.password_hash, new_password):
            raise ValidationFailedError("A nova senha deve ser diferente da atual")

        now = datetime.now(UTC)
        user.password_hash = hash_password(new_password)
        user.password_changed_at = now
        user.must_change_password = False
        revoked = self._sessions.revoke_all_for_user_except(
            user.id, current_session_id, RevocationReason.PASSWORD_CHANGED, now
        )
        self._db.commit()
        logger.info("password_changed user_id=%s other_sessions_revoked=%s", user.id, revoked)
        return revoked

    # ── Usuário atual ────────────────────────────────────────────────────────

    def resolve_user(self, claims: AccessTokenClaims) -> User:
        """Valida que a sessão do token segue ativa e que o usuário continua ativo."""
        session = self._sessions.get(claims.session_id)
        now = datetime.now(UTC)
        if (
            session is None
            or session.user_id != claims.user_id
            or session.revoked_at is not None
            or session.expires_at <= now
        ):
            raise UnauthorizedError()

        user = self._users.get_by_id(claims.user_id)
        if user is None or not user.is_active:
            raise UnauthorizedError()
        return user
