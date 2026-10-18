import uuid
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.models.refresh_token import RefreshToken
from backend.models.session import UserSession


class SessionRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def add(
        self,
        user_id: uuid.UUID,
        expires_at: datetime,
        user_agent: str | None,
        ip_address: str | None,
    ) -> UserSession:
        session = UserSession(
            user_id=user_id,
            expires_at=expires_at,
            user_agent=user_agent[:512] if user_agent else None,
            ip_address=ip_address,
        )
        self._db.add(session)
        self._db.flush()
        return session

    def get(self, session_id: uuid.UUID) -> UserSession | None:
        return self._db.get(UserSession, session_id)

    def get_for_update(self, session_id: uuid.UUID) -> UserSession | None:
        return self._db.scalar(
            select(UserSession).where(UserSession.id == session_id).with_for_update()
        )

    def revoke(self, session: UserSession, reason: str, now: datetime) -> None:
        if session.revoked_at is None:
            session.revoked_at = now
            session.revoked_reason = reason

    def revoke_all_for_user(self, user_id: uuid.UUID, reason: str, now: datetime) -> int:
        result = self._db.execute(
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
            .values(revoked_at=now, revoked_reason=reason)
        )
        return result.rowcount or 0  # type: ignore[attr-defined]

    def revoke_all_for_user_except(
        self, user_id: uuid.UUID, keep_session_id: uuid.UUID, reason: str, now: datetime
    ) -> int:
        result = self._db.execute(
            update(UserSession)
            .where(
                UserSession.user_id == user_id,
                UserSession.id != keep_session_id,
                UserSession.revoked_at.is_(None),
            )
            .values(revoked_at=now, revoked_reason=reason)
        )
        return result.rowcount or 0  # type: ignore[attr-defined]


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def add(self, session_id: uuid.UUID, token_hash: str, expires_at: datetime) -> RefreshToken:
        token = RefreshToken(session_id=session_id, token_hash=token_hash, expires_at=expires_at)
        self._db.add(token)
        self._db.flush()
        return token

    def get(self, token_id: uuid.UUID) -> RefreshToken | None:
        return self._db.get(RefreshToken, token_id)

    def get_by_hash_for_update(self, token_hash: str) -> RefreshToken | None:
        # FOR UPDATE serializa refreshes concorrentes do mesmo token.
        return self._db.scalar(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash).with_for_update()
        )
