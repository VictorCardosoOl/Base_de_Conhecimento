import uuid
from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from backend.models.account_token import AccountToken, AccountTokenPurpose


class AccountTokenRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def add(
        self,
        user_id: uuid.UUID,
        purpose: AccountTokenPurpose,
        token_hash: str,
        email: str,
        expires_at: datetime,
    ) -> AccountToken:
        token = AccountToken(
            user_id=user_id,
            purpose=purpose.value,
            token_hash=token_hash,
            email=email,
            expires_at=expires_at,
        )
        self._db.add(token)
        self._db.flush()
        return token

    def get_by_hash_for_update(
        self, token_hash: str, purpose: AccountTokenPurpose
    ) -> AccountToken | None:
        # FOR UPDATE: dois usos simultâneos do mesmo link ficam em fila; o segundo vê used_at.
        return self._db.scalar(
            select(AccountToken)
            .where(AccountToken.token_hash == token_hash, AccountToken.purpose == purpose.value)
            .with_for_update()
        )

    def delete_unused(
        self, user_id: uuid.UUID, purpose: AccountTokenPurpose, keep_id: uuid.UUID | None = None
    ) -> int:
        """Invalida os links pendentes da finalidade (um pedido novo substitui os antigos)."""
        conditions = [
            AccountToken.user_id == user_id,
            AccountToken.purpose == purpose.value,
            AccountToken.used_at.is_(None),
        ]
        if keep_id is not None:
            conditions.append(AccountToken.id != keep_id)
        result = self._db.execute(delete(AccountToken).where(*conditions))
        return result.rowcount or 0  # type: ignore[attr-defined]
