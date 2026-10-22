"""Envio de email (SMTP, desligado), nomes reservados, validação da configuração e CLI."""

import logging
from typing import Any, ClassVar

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend import cli
from backend.core import email as email_module
from backend.core.config import Settings
from backend.core.email import (
    DisabledEmailSender,
    OutgoingEmail,
    SmtpEmailSender,
    build_email_sender,
    deliver,
)
from backend.core.reserved_usernames import is_reserved_username
from backend.models.user import Role, User
from tests.conftest import BASE_ENV, TERMS

MESSAGE = OutgoingEmail(to="pessoa@empresa.com", subject="Assunto", text="link com token-secreto")


def _settings(**overrides: str) -> Settings:
    values = {k: v for k, v in {**BASE_ENV, **overrides}.items() if k != "AUTHSERVICE_ENV_FILE"}
    return Settings(_env_file=None, **values)  # type: ignore[arg-type]


# ── Email ────────────────────────────────────────────────────────────────────


class FakeSmtp:
    instances: ClassVar[list["FakeSmtp"]] = []

    def __init__(self, host: str, port: int, timeout: int, **kwargs: Any) -> None:
        self.host, self.port, self.timeout = host, port, timeout
        self.calls: list[str] = []
        self.sent: list[Any] = []
        FakeSmtp.instances.append(self)

    def __enter__(self) -> "FakeSmtp":
        return self

    def __exit__(self, *args: object) -> None:
        self.calls.append("quit")

    def starttls(self, context: Any) -> None:
        self.calls.append("starttls")

    def login(self, user: str, password: str) -> None:
        self.calls.append(f"login:{user}")

    def send_message(self, message: Any) -> None:
        self.sent.append(message)


@pytest.fixture
def fake_smtp(monkeypatch: pytest.MonkeyPatch) -> type[FakeSmtp]:
    FakeSmtp.instances = []
    monkeypatch.setattr(email_module.smtplib, "SMTP", FakeSmtp)
    monkeypatch.setattr(email_module.smtplib, "SMTP_SSL", FakeSmtp)
    return FakeSmtp


def test_smtp_com_starttls_e_autenticacao(fake_smtp):
    settings = _settings(
        EMAIL_BACKEND="smtp",
        SMTP_HOST="smtp.provedor.com",
        SMTP_USERNAME="apikey",
        SMTP_PASSWORD="segredo",
        EMAIL_FROM="Base <nao-responda@empresa.com>",
    )
    sender = build_email_sender(settings)
    assert isinstance(sender, SmtpEmailSender)
    sender.send(MESSAGE)

    smtp = fake_smtp.instances[0]
    assert (smtp.host, smtp.port) == ("smtp.provedor.com", 587)
    assert smtp.calls[:2] == ["starttls", "login:apikey"]
    sent = smtp.sent[0]
    assert sent["To"] == "pessoa@empresa.com"
    assert sent["From"] == "Base <nao-responda@empresa.com>"
    assert sent["Message-ID"].endswith("@empresa.com>")
    assert "token-secreto" in sent.get_content()


def test_smtp_ssl_e_sem_tls_local(fake_smtp):
    build_email_sender(
        _settings(EMAIL_BACKEND="smtp", SMTP_HOST="h", SMTP_SECURITY="ssl", SMTP_PORT="465")
    ).send(MESSAGE)
    build_email_sender(
        _settings(EMAIL_BACKEND="smtp", SMTP_HOST="mailpit", SMTP_SECURITY="none")
    ).send(MESSAGE)
    ssl_smtp, plain = fake_smtp.instances
    assert ssl_smtp.port == 465 and "starttls" not in ssl_smtp.calls
    assert "starttls" not in plain.calls and not any(c.startswith("login") for c in plain.calls)


def test_email_desligado_so_registra_sem_conteudo(caplog: pytest.LogCaptureFixture):
    sender = build_email_sender(_settings(EMAIL_BACKEND="disabled"))
    assert isinstance(sender, DisabledEmailSender)
    with caplog.at_level(logging.INFO):
        sender.send(MESSAGE)
    assert "email_not_sent" in caplog.text
    assert "token-secreto" not in caplog.text
    assert "pessoa@empresa.com" not in caplog.text


def test_deliver_engole_falhas_sem_vazar_conteudo(caplog: pytest.LogCaptureFixture):
    class Broken:
        def send(self, message: OutgoingEmail) -> None:
            raise OSError("conexão recusada")

    deliver(Broken(), MESSAGE)
    assert "email_send_failed" in caplog.text
    assert "token-secreto" not in caplog.text
    assert "pessoa@empresa.com" not in caplog.text


# ── Configuração ─────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"PUBLIC_APP_URL": "https://kb.empresa.com/caminho"}, "PUBLIC_APP_URL"),
        ({"PUBLIC_APP_URL": "kb.empresa.com"}, "PUBLIC_APP_URL"),
        ({"EMAIL_BACKEND": "smtp"}, "SMTP_HOST"),
        ({"OAUTH_GOOGLE_CLIENT_ID": "id"}, "OAUTH_GOOGLE_CLIENT_SECRET"),
        ({"OAUTH_GITHUB_CLIENT_SECRET": "s"}, "OAUTH_GITHUB_CLIENT_ID"),
    ],
)
def test_configuracao_invalida_falha_no_boot(overrides: dict[str, str], message: str):
    with pytest.raises(ValidationError, match=message):
        _settings(**overrides)


PRODUCTION = {
    "ENVIRONMENT": "production",
    "ARGON2_TIME_COST": "2",
    "ARGON2_MEMORY_COST_KIB": "19456",
    "EMAIL_BACKEND": "smtp",
    "SMTP_HOST": "smtp.provedor.com",
}


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"PUBLIC_APP_URL": "http://kb.empresa.com"}, "https"),
        ({"EMAIL_BACKEND": "memory"}, "só para testes"),
        ({"SMTP_SECURITY": "none"}, "SMTP sem TLS"),
    ],
)
def test_producao_exige_https_e_email_com_tls(overrides: dict[str, str], message: str):
    with pytest.raises(ValidationError, match=message):
        _settings(**{**PRODUCTION, **overrides})


def test_configuracao_de_producao_valida():
    settings = _settings(**PRODUCTION)
    assert settings.oauth_state_cookie_name == "__Secure-kb_oauth_state"
    local = _settings(
        COOKIE_SECURE="false", ACCESS_COOKIE_NAME="kb_at", REFRESH_COOKIE_NAME="kb_rt"
    )
    assert local.oauth_signup_cookie_name == "kb_oauth_signup"


def test_openapi_padrao_depende_do_ambiente(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("OPENAPI_ENABLED", raising=False)
    assert _settings().OPENAPI_ENABLED is True
    assert _settings(**PRODUCTION).OPENAPI_ENABLED is False
    # Valor explícito prevalece nos dois ambientes.
    assert _settings(**PRODUCTION, OPENAPI_ENABLED="true").OPENAPI_ENABLED is True
    assert _settings(OPENAPI_ENABLED="false").OPENAPI_ENABLED is False


# ── Nomes reservados ─────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("username", "reserved"),
    [
        ("admin", True),
        ("Admin", True),
        ("su.por-te", True),
        ("root", True),
        ("no_reply", True),
        ("maria.silva", False),
        ("administracao", False),
    ],
)
def test_nomes_reservados(username: str, reserved: bool):
    assert is_reserved_username(username) is reserved


def test_disponibilidade_avisa_nome_reservado(client: TestClient):
    response = client.get("/auth/username-available", params={"username": "Suporte"})
    assert response.json() == {"username": "suporte", "available": False, "reason": "reserved"}


def test_cadastro_publico_recusa_nome_reservado(client: TestClient, configure, db: Session):
    configure(PUBLIC_REGISTRATION_ENABLED="true")
    body = {
        "email": "nova@empresa.com",
        "password": "uma-senha-bem-longa",
        "username": "ROOT",
        "display_name": "Nova",
        **TERMS,
    }
    response = client.post("/auth/register", json=body)
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["details"] == [{"field": "username", "message": error["message"]}]
    assert "reservado" in error["message"]
    assert db.scalar(select(func.count()).select_from(User)) == 0


def test_admin_pode_usar_nome_reservado(client: TestClient, make_user, login):
    make_user(email="chefe@empresa.com", role=Role.ADMIN, username="chefe")
    login(email="chefe@empresa.com")
    response = client.post(
        "/admin/users",
        json={
            "email": "suporte@empresa.com",
            "password": "senha-temporaria-longa",
            "username": "suporte",
            "display_name": "Suporte",
        },
    )
    assert response.status_code == 201


def test_unicidade_ignora_maiusculas_tambem_no_banco(db: Session, make_user):
    # O banco só aceita a forma canônica (minúsculas) e o índice único vale sobre ela:
    # "Maria" nunca convive com "maria".
    make_user(email="a@empresa.com", username="maria")
    db.add(
        User(
            email="b@empresa.com",
            username="Maria",
            display_name="B",
            password_hash="x",
            role=Role.USER.value,
        )
    )
    with pytest.raises(IntegrityError, match="ck_users_username_format"):
        db.commit()
    db.rollback()


# ── CLI: limpeza das contas dos testes E2E ───────────────────────────────────


def test_limpeza_e2e_apaga_so_as_contas_dos_testes(configure, db: Session, make_user):
    configure(SEED_DEV_USERS="true")
    make_user(email="cadastro-1700000000000@exemplo.com.br", username="cadastro.1")
    make_user(email="e2e-1700000000001@exemplo.com.br", username="e2e.1")
    make_user(email="cadastro-real@exemplo.com.br", username="real")
    make_user(email="pessoa@empresa.com", username="pessoa")

    assert cli.delete_e2e_users() == 2
    db.expire_all()
    remaining = set(db.scalars(select(User.email)).all())
    assert remaining == {"cadastro-real@exemplo.com.br", "pessoa@empresa.com"}


def test_limpeza_e2e_so_em_desenvolvimento(configure):
    configure(SEED_DEV_USERS="false")
    with pytest.raises(SystemExit, match="desenvolvimento"):
        cli.delete_e2e_users()


def test_purge_remove_links_e_estados_vencidos(
    client: TestClient, make_user, db: Session, capsys: pytest.CaptureFixture[str]
):
    from datetime import UTC, datetime, timedelta

    from sqlalchemy import update

    from backend.models.account_token import AccountToken

    make_user()
    client.post("/auth/password/forgot", json={"email": "usuario@empresa.com"})
    db.execute(update(AccountToken).values(expires_at=datetime.now(UTC) - timedelta(minutes=1)))
    db.commit()

    cli.purge_expired()
    assert "links e estados temporários removidos: 1" in capsys.readouterr().out
    assert db.scalar(select(func.count()).select_from(AccountToken)) == 0
