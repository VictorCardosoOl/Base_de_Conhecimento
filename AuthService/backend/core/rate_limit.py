"""Rate limiting com interface substituível.

A implementação padrão usa PostgreSQL, então funciona com várias instâncias do
serviço. Para trocar por Redis, basta outra classe que implemente `RateLimiter`.
"""

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Protocol

from sqlalchemy import Engine, delete, select
from sqlalchemy.dialects.postgresql import insert

from backend.models.rate_limit import RateLimitBucket


@dataclass(frozen=True)
class RateLimitResult:
    allowed: bool
    count: int
    retry_after_seconds: int


class RateLimiter(Protocol):
    def hit(self, key: str, limit: int, window_seconds: int) -> RateLimitResult: ...

    def peek(self, key: str, limit: int, window_seconds: int) -> RateLimitResult:
        """Consulta a janela atual sem contar a tentativa."""
        ...


def rate_limit_key(*parts: str) -> str:
    """Hash do identificador: o banco não guarda IP nem email em claro."""
    return hashlib.sha256("|".join(parts).encode()).hexdigest()


class PostgresRateLimiter:
    """Janela fixa. Usa transação própria: a contagem persiste mesmo se o login falhar."""

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    @staticmethod
    def _window(window_seconds: int) -> tuple[datetime, datetime, datetime]:
        now = datetime.now(UTC)
        epoch = int(now.timestamp())
        window_start = datetime.fromtimestamp(epoch - epoch % window_seconds, UTC)
        return now, window_start, window_start + timedelta(seconds=window_seconds)

    def peek(self, key: str, limit: int, window_seconds: int) -> RateLimitResult:
        """Bloqueado quando a janela atual já tem `limit` tentativas contadas."""
        now, window_start, window_end = self._window(window_seconds)
        with self._engine.connect() as connection:
            count = (
                connection.execute(
                    select(RateLimitBucket.count).where(
                        RateLimitBucket.key == key, RateLimitBucket.window_start == window_start
                    )
                ).scalar_one_or_none()
                or 0
            )
        retry_after = max(1, int((window_end - now).total_seconds()))
        return RateLimitResult(allowed=count < limit, count=count, retry_after_seconds=retry_after)

    def hit(self, key: str, limit: int, window_seconds: int) -> RateLimitResult:
        now, window_start, window_end = self._window(window_seconds)

        statement = (
            insert(RateLimitBucket)
            .values(key=key, window_start=window_start, count=1, expires_at=window_end)
            .on_conflict_do_update(
                index_elements=[RateLimitBucket.key, RateLimitBucket.window_start],
                set_={"count": RateLimitBucket.count + 1},
            )
            .returning(RateLimitBucket.count)
        )
        with self._engine.begin() as connection:
            count = connection.execute(statement).scalar_one()

        retry_after = max(1, int((window_end - now).total_seconds()))
        return RateLimitResult(allowed=count <= limit, count=count, retry_after_seconds=retry_after)

    def purge_expired(self) -> int:
        with self._engine.begin() as connection:
            result = connection.execute(
                delete(RateLimitBucket).where(RateLimitBucket.expires_at < datetime.now(UTC))
            )
        return result.rowcount or 0
