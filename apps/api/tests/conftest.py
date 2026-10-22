"""Infraestrutura de testes.

Os testes rodam contra um PostgreSQL real, indicado por TEST_DATABASE_URL
(ex.: postgresql+psycopg://postgres:postgres@localhost:5432/authservice_test).
O schema `auth` desse banco é recriado a cada execução.
"""

import os
from collections.abc import Callable, Iterator, Sequence
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from backend.core import config as config_module
from backend.core import database, passwords, tokens
from backend.core.email import MemoryEmailSender, OutgoingEmail
from backend.dependencies import dependencies
from backend.main import create_app
from backend.models.user import Role, User
from backend.services.user_service import UserService

ROOT = Path(__file__).resolve().parent.parent
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL:
    raise pytest.UsageError("Defina TEST_DATABASE_URL apontando para um PostgreSQL de teste.")

APP_ORIGIN = "https://app.test"
PASSWORD = "senha-de-teste-segura"


def _pem(key: Ed25519PrivateKey) -> str:
    return key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()


SIGNING_KEY = Ed25519PrivateKey.generate()

BASE_ENV = {
    "ENVIRONMENT": "test",
    "DATABASE_URL": TEST_DATABASE_URL,
    "JWT_PRIVATE_KEY": _pem(SIGNING_KEY),
    "JWT_ISSUER": "https://auth.test",
    "JWT_AUDIENCE": "knowledge-api",
    "ACCESS_TOKEN_TTL_SECONDS": "600",
    "REFRESH_TOKEN_TTL_SECONDS": "86400",
    "SESSION_MAX_LIFETIME_SECONDS": "604800",
    "COOKIE_SECURE": "true",
    "COOKIE_SAMESITE": "lax",
    "ACCESS_COOKIE_NAME": "__Host-kb_at",
    "REFRESH_COOKIE_NAME": "__Secure-kb_rt",
    "REFRESH_COOKIE_PATH": "/auth",
    "TRUSTED_ORIGINS": APP_ORIGIN,
    "CORS_ALLOWED_ORIGINS": "",
    "LOGIN_RATE_LIMIT_ATTEMPTS": "5",
    "LOGIN_RATE_LIMIT_IP_ATTEMPTS": "30",
    "LOGIN_RATE_LIMIT_WINDOW_SECONDS": "60",
    "TRUSTED_PROXY_COUNT": "0",
    # Custo baixo só nos testes; produção exige o mínimo do OWASP.
    "ARGON2_TIME_COST": "1",
    "ARGON2_MEMORY_COST_KIB": "1024",
    "ARGON2_PARALLELISM": "1",
    "LOG_LEVEL": "INFO",
    "PUBLIC_APP_URL": APP_ORIGIN,
    # Emails ficam numa caixa de saída em memória (fixture `outbox`).
    "EMAIL_BACKEND": "memory",
    # Ignora qualquer .env local: os testes dependem só destas variáveis.
    "AUTHSERVICE_ENV_FILE": "",
}
for _name in (
    "JWT_PRIVATE_KEY_FILE",
    "JWT_ADDITIONAL_PUBLIC_KEYS",
    "JWT_ADDITIONAL_PUBLIC_KEYS_FILE",
):
    os.environ.pop(_name, None)
os.environ.update(BASE_ENV)


def clear_caches() -> None:
    config_module.get_settings.cache_clear()
    if database.get_engine.cache_info().currsize:
        database.get_engine().dispose()
    database.get_engine.cache_clear()
    database.get_session_factory.cache_clear()
    tokens.get_key_set.cache_clear()
    passwords.get_password_hasher.cache_clear()
    passwords._dummy_hash.cache_clear()
    dependencies.get_rate_limiter.cache_clear()
    dependencies.get_email_sender.cache_clear()
    dependencies.get_oauth_providers.cache_clear()


@pytest.fixture(scope="session", autouse=True)
def migrated_database() -> None:
    engine = create_engine(TEST_DATABASE_URL)
    with engine.begin() as connection:
        connection.execute(text('DROP SCHEMA IF EXISTS "auth" CASCADE'))
    engine.dispose()

    alembic_config = Config(str(ROOT / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(ROOT / "migrations"))
    alembic_config.attributes["database_url"] = TEST_DATABASE_URL
    command.upgrade(alembic_config, "head")


@pytest.fixture(autouse=True)
def clean_state(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    for name, value in BASE_ENV.items():
        monkeypatch.setenv(name, value)
    clear_caches()
    engine = create_engine(TEST_DATABASE_URL)
    with engine.begin() as connection:
        connection.execute(
            text(
                "TRUNCATE auth.refresh_tokens, auth.sessions, auth.users, "
                "auth.rate_limit_buckets, auth.account_tokens, auth.oauth_identities, "
                "auth.oauth_states, auth.oauth_pending_signups, auth.terms_acceptances, "
                "auth.article_ratings, auth.article_corrections, auth.article_comments "
                "RESTART IDENTITY CASCADE"
            )
        )
    engine.dispose()
    yield
    clear_caches()


@pytest.fixture
def configure(monkeypatch: pytest.MonkeyPatch) -> Callable[..., None]:
    """Altera variáveis de ambiente para um teste e recarrega a configuração."""

    def apply(**overrides: str) -> None:
        for name, value in overrides.items():
            monkeypatch.setenv(name, value)
        clear_caches()

    return apply


@pytest.fixture
def app() -> FastAPI:
    return create_app()


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    # HTTPS para que os cookies Secure sejam reenviados; Origin de navegador confiável.
    with TestClient(app, base_url="https://testserver", headers={"Origin": APP_ORIGIN}) as c:
        yield c


@pytest.fixture
def db() -> Iterator[Session]:
    session = database.get_session_factory()()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def make_user(db: Session) -> Callable[..., User]:
    def factory(
        email: str = "usuario@empresa.com",
        password: str = PASSWORD,
        role: Role = Role.USER,
        is_active: bool = True,
        username: str | None = None,
        display_name: str = "Pessoa de Teste",
    ) -> User:
        # Sem usuário explícito, deriva do email (único entre os testes, como o email).
        derived = email.split("@")[0].lower().replace("+", "-")
        user = UserService(db).create_user(
            email, password, role, username=username or derived, display_name=display_name
        )
        if not is_active:
            user.is_active = False
            db.commit()
        return user

    return factory


class Outbox(Sequence[OutgoingEmail]):
    """Emails "enviados" (EMAIL_BACKEND=memory), na ordem de envio.

    Lê sempre o remetente atual: `configure` recria o remetente durante o teste.
    """

    def _items(self) -> list[OutgoingEmail]:
        sender = dependencies.get_email_sender()
        assert isinstance(sender, MemoryEmailSender)
        return sender.outbox

    def __getitem__(self, index):  # type: ignore[no-untyped-def]
        return self._items()[index]

    def __len__(self) -> int:
        return len(self._items())

    def __eq__(self, other: object) -> bool:
        return self._items() == other

    __hash__ = None  # type: ignore[assignment]


@pytest.fixture
def outbox() -> Outbox:
    return Outbox()


# Versões vigentes dos documentos (padrão de Settings) e o aceite obrigatório.
TERMS = {"accept_terms": True, "terms_version": "2026-10-10", "privacy_version": "2026-10-10"}


@pytest.fixture
def login(client: TestClient) -> Callable[..., object]:
    def do_login(email: str = "usuario@empresa.com", password: str = PASSWORD) -> object:
        return client.post("/auth/login", json={"email": email, "password": password})

    return do_login
