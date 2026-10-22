import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.models.oauth import OAuthIdentity, OAuthLoginState, OAuthPendingSignup


class OAuthRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    # ── Vínculos ─────────────────────────────────────────────────────────────

    def get_identity(self, provider: str, subject: str) -> OAuthIdentity | None:
        return self._db.scalar(
            select(OAuthIdentity).where(
                OAuthIdentity.provider == provider, OAuthIdentity.subject == subject
            )
        )

    def get_identity_for_user(self, user_id: uuid.UUID, provider: str) -> OAuthIdentity | None:
        return self._db.scalar(
            select(OAuthIdentity).where(
                OAuthIdentity.user_id == user_id, OAuthIdentity.provider == provider
            )
        )

    def add_identity(
        self, user_id: uuid.UUID, provider: str, subject: str, email: str, now: datetime
    ) -> OAuthIdentity:
        identity = OAuthIdentity(
            user_id=user_id, provider=provider, subject=subject, email=email, last_login_at=now
        )
        self._db.add(identity)
        self._db.flush()
        return identity

    def providers_of(self, user_id: uuid.UUID) -> list[str]:
        return list(
            self._db.scalars(
                select(OAuthIdentity.provider)
                .where(OAuthIdentity.user_id == user_id)
                .order_by(OAuthIdentity.provider)
            ).all()
        )

    # ── Estado do fluxo (state + PKCE) ───────────────────────────────────────

    def add_state(
        self,
        state_hash: str,
        provider: str,
        code_verifier: str,
        next_path: str,
        expires_at: datetime,
    ) -> None:
        self._db.add(
            OAuthLoginState(
                state_hash=state_hash,
                provider=provider,
                code_verifier=code_verifier,
                next_path=next_path,
                expires_at=expires_at,
            )
        )
        self._db.flush()

    def pop_state(self, state_hash: str) -> OAuthLoginState | None:
        """Lê e remove (uso único). O commit fica com quem chama."""
        state = self._db.scalar(
            select(OAuthLoginState)
            .where(OAuthLoginState.state_hash == state_hash)
            .with_for_update()
        )
        if state is not None:
            self._db.delete(state)
            self._db.flush()
        return state

    # ── Cadastro social pendente ─────────────────────────────────────────────

    def add_pending(self, pending: OAuthPendingSignup) -> OAuthPendingSignup:
        self._db.add(pending)
        self._db.flush()
        return pending

    def get_pending(self, token_hash: str, for_update: bool = False) -> OAuthPendingSignup | None:
        statement = select(OAuthPendingSignup).where(OAuthPendingSignup.token_hash == token_hash)
        if for_update:
            statement = statement.with_for_update()
        return self._db.scalar(statement)

    def delete_pending(self, pending: OAuthPendingSignup) -> None:
        self._db.delete(pending)
        self._db.flush()
