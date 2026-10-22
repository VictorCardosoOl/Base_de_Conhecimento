from datetime import datetime

from sqlalchemy import CHAR, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column

from backend.models.base import Base


class RateLimitBucket(Base):
    """Contador de janela fixa compartilhado entre instâncias (via PostgreSQL).

    `key` é o SHA-256 do identificador (IP, IP+email), para não guardar dados pessoais.
    """

    __tablename__ = "rate_limit_buckets"

    key: Mapped[str] = mapped_column(CHAR(64), primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
