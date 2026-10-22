"""Confirmação de email: link no cadastro, reenvio e uso único (ADR-0012)."""

import re

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.core.email import OutgoingEmail
from backend.models.user import User
from tests.conftest import TERMS

_TOKEN = re.compile(r"/verificar-email#token=([A-Za-z0-9_-]+)")

NEW = {
    "email": "nova@empresa.com",
    "password": "uma-senha-bem-longa",
    "username": "nova",
    "display_name": "Nova Pessoa",
    **TERMS,
}


def _token_from(message: OutgoingEmail) -> str:
    match = _TOKEN.search(message.text)
    assert match, "o email deveria trazer o link de confirmação"
    return match.group(1)


def _verify(client: TestClient, token: str):
    return client.post("/auth/email/verify", json={"token": token})


def test_cadastro_envia_link_e_confirmacao_marca_o_email(client: TestClient, configure, outbox):
    configure(PUBLIC_REGISTRATION_ENABLED="true")
    assert client.post("/auth/register", json=NEW).status_code == 201
    assert client.get("/auth/me").json()["email_verified"] is False

    assert [message.to for message in outbox] == ["nova@empresa.com"]
    assert outbox[0].subject == "Confirme seu email"
    assert "24 horas" in outbox[0].text

    assert _verify(client, _token_from(outbox[0])).status_code == 204
    assert client.get("/auth/me").json()["email_verified"] is True


def test_link_de_confirmacao_e_de_uso_unico(client: TestClient, configure, outbox):
    configure(PUBLIC_REGISTRATION_ENABLED="true")
    client.post("/auth/register", json=NEW)
    token = _token_from(outbox[0])

    assert _verify(client, token).status_code == 204
    again = _verify(client, token)
    assert again.status_code == 400
    assert again.json()["error"]["code"] == "INVALID_TOKEN"


def test_reenvio_exige_sessao(client: TestClient):
    assert client.post("/auth/email/verification").status_code == 401


def test_reenvio_invalida_o_link_anterior(client: TestClient, make_user, login, outbox):
    make_user()
    login()

    first = client.post("/auth/email/verification")
    second = client.post("/auth/email/verification")

    assert first.status_code == second.status_code == 202
    assert len(outbox) == 2
    assert _verify(client, _token_from(outbox[0])).status_code == 400
    assert _verify(client, _token_from(outbox[1])).status_code == 204


def test_reenvio_com_email_ja_confirmado(client: TestClient, make_user, login, outbox, db: Session):
    user = make_user()
    row = db.get(User, user.id)
    assert row is not None
    row.email_verified_at = row.created_at
    db.commit()
    login()

    response = client.post("/auth/email/verification")
    assert response.status_code == 202
    assert response.json()["message"] == "Seu email já está confirmado."
    assert outbox == []


def test_reenvio_tem_limite(client: TestClient, make_user, login, configure):
    configure(EMAIL_VERIFICATION_RESEND_ATTEMPTS="1")
    make_user()
    login()
    statuses = [client.post("/auth/email/verification").status_code for _ in range(2)]
    assert statuses == [202, 429]


def test_link_de_redefinicao_nao_serve_para_confirmar(client: TestClient, make_user, outbox):
    make_user()
    client.post("/auth/password/forgot", json={"email": "usuario@empresa.com"})
    token = re.search(r"#token=([A-Za-z0-9_-]+)", outbox[0].text)
    assert token
    assert _verify(client, token.group(1)).status_code == 400
