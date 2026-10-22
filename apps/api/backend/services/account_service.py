"""Recuperação de senha e confirmação de email por links de uso único (ADR-0012).

- O pedido de redefinição tem sempre a mesma resposta, exista ou não a conta: o email só
  é enviado (em segundo plano) quando a conta existe e está ativa.
- O token tem 256 bits, vale por pouco tempo, é de uso único e só o SHA-256 vai ao banco.
  Um pedido novo invalida os anteriores.
- Redefinir a senha encerra todas as sessões e avisa o titular por email.
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from backend.core.config import Settings
from backend.core.email import OutgoingEmail
from backend.core.email_templates import (
    email_verification_email,
    password_changed_email,
    password_reset_email,
)
from backend.core.errors import InvalidTokenError, RateLimitedError
from backend.core.logger import get_logger
from backend.core.passwords import hash_password
from backend.core.rate_limit import RateLimiter, rate_limit_key
from backend.core.tokens import generate_refresh_token, hash_refresh_token
from backend.models.account_token import AccountTokenPurpose
from backend.models.user import User
from backend.repositories.account_token_repository import AccountTokenRepository
from backend.repositories.session_repository import SessionRepository
from backend.repositories.user_repository import UserRepository, normalize_email

logger = get_logger(__name__)

PASSWORD_RESET_BY_EMAIL = "password_reset_by_email"  # noqa: S105 (motivo de revogação)
INVALID_RESET_LINK = "Link de redefinição inválido ou expirado. Peça um novo."
INVALID_VERIFICATION_LINK = "Link de confirmação inválido ou expirado. Peça um novo em Minha conta."


class AccountService:
    def __init__(self, db: Session, settings: Settings, rate_limiter: RateLimiter) -> None:
        self._db = db
        self._settings = settings
        self._rate_limiter = rate_limiter
        self._users = UserRepository(db)
        self._tokens = AccountTokenRepository(db)
        self._sessions = SessionRepository(db)

    def _limit(self, key: str, limit: int, window: int) -> None:
        result = self._rate_limiter.hit(key, limit, window)
        if not result.allowed:
            raise RateLimitedError(result.retry_after_seconds)

    def _link(self, path: str, token: str) -> str:
        # Token no fragmento (#): não vai para logs de servidor nem para o Referer.
        return f"{self._settings.PUBLIC_APP_URL}{path}#token={token}"

    def _issue(self, user: User, purpose: AccountTokenPurpose, ttl_seconds: int) -> str:
        raw = generate_refresh_token()
        self._tokens.delete_unused(user.id, purpose)
        self._tokens.add(
            user.id,
            purpose,
            hash_refresh_token(raw),
            user.email,
            datetime.now(UTC) + timedelta(seconds=ttl_seconds),
        )
        return raw

    # ── Esqueci a senha ──────────────────────────────────────────────────────

    def request_password_reset(self, email: str, ip_address: str | None) -> OutgoingEmail | None:
        """Devolve o email a enviar, ou None. A resposta HTTP é a mesma nos dois casos."""
        settings = self._settings
        window = settings.PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS
        self._limit(
            rate_limit_key("password-reset-ip", ip_address or "unknown"),
            settings.PASSWORD_RESET_RATE_LIMIT_IP_ATTEMPTS,
            window,
        )
        # Por email, exista ele ou não: o limite não revela se a conta existe.
        self._limit(
            rate_limit_key("password-reset-email", normalize_email(email)),
            settings.PASSWORD_RESET_RATE_LIMIT_EMAIL_ATTEMPTS,
            window,
        )

        user = self._users.get_by_email(email)
        if user is None or not user.is_active:
            logger.info("password_reset_requested result=ignored")
            return None

        raw = self._issue(
            user, AccountTokenPurpose.PASSWORD_RESET, settings.PASSWORD_RESET_TOKEN_TTL_SECONDS
        )
        self._db.commit()
        logger.info("password_reset_requested result=issued user_id=%s", user.id)
        return password_reset_email(
            user.email,
            self._link("/redefinir-senha", raw),
            settings.PASSWORD_RESET_TOKEN_TTL_SECONDS // 60,
        )

    def reset_password(
        self, raw_token: str, new_password: str, ip_address: str | None
    ) -> OutgoingEmail:
        """Define a nova senha a partir do link. Devolve o aviso de troca para o titular."""
        self._limit(
            rate_limit_key("token-confirm-ip", ip_address or "unknown"),
            self._settings.TOKEN_CONFIRM_RATE_LIMIT_IP_ATTEMPTS,
            self._settings.TOKEN_CONFIRM_RATE_LIMIT_WINDOW_SECONDS,
        )
        now = datetime.now(UTC)
        token = self._tokens.get_by_hash_for_update(
            hash_refresh_token(raw_token), AccountTokenPurpose.PASSWORD_RESET
        )
        if token is None or token.used_at is not None or token.expires_at <= now:
            raise InvalidTokenError(INVALID_RESET_LINK)
        user = self._users.get_for_update(token.user_id)
        if user is None or not user.is_active or user.email != token.email:
            raise InvalidTokenError(INVALID_RESET_LINK)

        user.password_hash = hash_password(new_password)
        user.password_changed_at = now
        user.must_change_password = False
        if user.email_verified_at is None:
            user.email_verified_at = now  # o link chegou à caixa de entrada: email comprovado
        token.used_at = now
        self._tokens.delete_unused(user.id, AccountTokenPurpose.PASSWORD_RESET, keep_id=token.id)
        revoked = self._sessions.revoke_all_for_user(user.id, PASSWORD_RESET_BY_EMAIL, now)
        self._db.commit()
        logger.info("password_reset_completed user_id=%s sessions_revoked=%s", user.id, revoked)
        return password_changed_email(user.email, f"{self._settings.PUBLIC_APP_URL}/esqueci-senha")

    # ── Confirmação de email ─────────────────────────────────────────────────

    def prepare_email_verification(self, user: User) -> OutgoingEmail | None:
        """Cria o link de confirmação (sem commit: quem chama decide). None se já confirmado."""
        if user.email_verified_at is not None:
            return None
        ttl = self._settings.EMAIL_VERIFICATION_TOKEN_TTL_SECONDS
        raw = self._issue(user, AccountTokenPurpose.EMAIL_VERIFICATION, ttl)
        return email_verification_email(
            user.email, self._link("/verificar-email", raw), ttl // 3600
        )

    def resend_verification(self, user: User) -> OutgoingEmail | None:
        self._limit(
            rate_limit_key("email-verification-resend", str(user.id)),
            self._settings.EMAIL_VERIFICATION_RESEND_ATTEMPTS,
            self._settings.EMAIL_VERIFICATION_RESEND_WINDOW_SECONDS,
        )
        message = self.prepare_email_verification(user)
        self._db.commit()
        if message is not None:
            logger.info("email_verification_sent user_id=%s", user.id)
        return message

    def verify_email(self, raw_token: str, ip_address: str | None) -> None:
        self._limit(
            rate_limit_key("token-confirm-ip", ip_address or "unknown"),
            self._settings.TOKEN_CONFIRM_RATE_LIMIT_IP_ATTEMPTS,
            self._settings.TOKEN_CONFIRM_RATE_LIMIT_WINDOW_SECONDS,
        )
        now = datetime.now(UTC)
        token = self._tokens.get_by_hash_for_update(
            hash_refresh_token(raw_token), AccountTokenPurpose.EMAIL_VERIFICATION
        )
        if token is None or token.used_at is not None or token.expires_at <= now:
            raise InvalidTokenError(INVALID_VERIFICATION_LINK)
        user = self._users.get_for_update(token.user_id)
        if user is None or not user.is_active or user.email != token.email:
            raise InvalidTokenError(INVALID_VERIFICATION_LINK)
        if user.email_verified_at is None:
            user.email_verified_at = now
        token.used_at = now
        self._db.commit()
        logger.info("email_verified user_id=%s", user.id)
