"""Esqueci a senha: pedido neutro, link de uso único com validade e nova senha (ADR-0012)."""

import logging
import re
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.core.email import OutgoingEmail
from backend.models.account_token import AccountToken
from backend.models.user import User
from tests.conftest import PASSWORD

EMAIL = "usuario@empresa.com"
NEW_PASSWORD = "minha-senha-nova-e-longa"
_TOKEN = re.compile(r"/redefinir-senha#token=([A-Za-z0-9_-]+)")


def _forgot(client: TestClient, email: str = EMAIL):
    return client.post("/auth/password/forgot", json={"email": email})


def _token_from(message: OutgoingEmail) -> str:
    match = _TOKEN.search(message.text)
    assert match, "o email deveria trazer o link de redefinição"
    return match.group(1)


def _reset(client: TestClient, token: str, password: str = NEW_PASSWORD):
    return client.post("/auth/password/reset", json={"token": token, "new_password": password})


def test_resposta_neutra_exista_ou_nao_a_conta(client: TestClient, make_user, outbox):
    make_user()
    existing = _forgot(client)
    missing = _forgot(client, "ninguem@empresa.com")

    assert existing.status_code == missing.status_code == 202
    assert existing.json() == missing.json()
    assert "Se houver uma conta" in existing.json()["message"]
    # Só a conta existente recebe o email.
    assert [message.to for message in outbox] == [EMAIL]


def test_link_aponta_para_o_site_e_token_nao_fica_em_claro(
    client: TestClient, make_user, outbox, db: Session
):
    make_user()
    _forgot(client)

    message = outbox[0]
    assert message.subject == "Redefinição de senha"
    assert "https://app.test/redefinir-senha#token=" in message.text
    assert "30 minutos" in message.text
    token = _token_from(message)
    stored = db.scalars(select(AccountToken.token_hash)).all()
    assert len(stored) == 1 and token not in stored[0]


def test_conta_desativada_nao_recebe_email(client: TestClient, make_user, outbox):
    make_user(is_active=False)
    assert _forgot(client).status_code == 202
    assert outbox == []


def test_redefine_a_senha_encerra_sessoes_e_avisa(
    client: TestClient, make_user, login, outbox, db: Session
):
    user = make_user()
    assert login().status_code == 200
    assert client.get("/auth/me").status_code == 200
    _forgot(client)

    response = _reset(client, _token_from(outbox[0]))

    assert response.status_code == 204
    # Sessões abertas caem; a senha antiga deixa de valer e a nova passa a valer.
    assert client.get("/auth/me").status_code == 401
    assert login(password=PASSWORD).status_code == 401
    assert login(password=NEW_PASSWORD).status_code == 200
    db.refresh(user)
    assert user.email_verified is True  # o link chegou à caixa de entrada
    assert user.must_change_password is False
    assert outbox[-1].subject == "Sua senha foi alterada"
    assert "https://app.test/esqueci-senha" in outbox[-1].text


def test_link_e_de_uso_unico(client: TestClient, make_user, outbox):
    make_user()
    _forgot(client)
    token = _token_from(outbox[0])

    assert _reset(client, token).status_code == 204
    again = _reset(client, token, "outra-senha-bem-longa")
    assert again.status_code == 400
    assert again.json()["error"]["code"] == "INVALID_TOKEN"


def test_link_vencido_e_recusado(client: TestClient, make_user, outbox, db: Session):
    make_user()
    _forgot(client)
    db.execute(update(AccountToken).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    db.commit()

    response = _reset(client, _token_from(outbox[0]))
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_novo_pedido_invalida_o_anterior(client: TestClient, make_user, outbox):
    make_user()
    _forgot(client)
    _forgot(client)
    first, second = _token_from(outbox[0]), _token_from(outbox[1])

    assert _reset(client, first).status_code == 400
    assert _reset(client, second).status_code == 204


def test_token_desconhecido_e_recusado(client: TestClient):
    response = _reset(client, "x" * 43)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_TOKEN"


def test_nova_senha_segue_a_politica_do_cadastro(client: TestClient, make_user, outbox):
    make_user()
    _forgot(client)
    token = _token_from(outbox[0])

    short = _reset(client, token, "curta")
    assert short.status_code == 400
    assert short.json()["error"]["details"][0]["field"] == "new_password"
    # O link continua valendo depois de uma senha recusada.
    assert _reset(client, token).status_code == 204


@pytest.mark.parametrize("email", ["sem-arroba", ""])
def test_email_invalido_e_400(client: TestClient, email: str):
    assert _forgot(client, email).status_code == 400


def test_limite_por_email_vale_tambem_para_email_inexistente(client: TestClient, configure):
    configure(PASSWORD_RESET_RATE_LIMIT_EMAIL_ATTEMPTS="2")
    statuses = [_forgot(client, "ninguem@empresa.com").status_code for _ in range(3)]
    assert statuses == [202, 202, 429]


def test_limite_por_ip(client: TestClient, configure):
    configure(PASSWORD_RESET_RATE_LIMIT_IP_ATTEMPTS="2")
    statuses = [_forgot(client, f"pessoa{i}@empresa.com").status_code for i in range(3)]
    assert statuses == [202, 202, 429]


def test_limite_no_uso_de_links(client: TestClient, configure):
    configure(TOKEN_CONFIRM_RATE_LIMIT_IP_ATTEMPTS="2")
    statuses = [_reset(client, "y" * 43).status_code for _ in range(3)]
    assert statuses == [400, 400, 429]


def test_origem_estranha_e_recusada(client: TestClient, make_user, outbox):
    make_user()
    response = client.post(
        "/auth/password/forgot", json={"email": EMAIL}, headers={"Origin": "https://evil.example"}
    )
    assert response.status_code == 403
    assert outbox == []


def test_token_nao_aparece_nos_logs(
    client: TestClient, make_user, outbox, caplog: pytest.LogCaptureFixture
):
    make_user()
    with caplog.at_level(logging.DEBUG):
        _forgot(client)
        token = _token_from(outbox[0])
        _reset(client, token)
    assert token not in caplog.text
    assert NEW_PASSWORD not in caplog.text


def test_falha_no_envio_nao_muda_a_resposta(
    client: TestClient, make_user, monkeypatch, caplog: pytest.LogCaptureFixture
):
    from backend.dependencies import dependencies

    make_user()

    def broken(_: OutgoingEmail) -> None:
        raise ConnectionError("smtp fora do ar")

    monkeypatch.setattr(dependencies.get_email_sender(), "send", broken)
    response = _forgot(client)
    assert response.status_code == 202
    assert "email_send_failed" in caplog.text
    assert EMAIL not in caplog.text


def test_conta_sem_senha_pode_criar_uma_pelo_link(
    client: TestClient, make_user, login, outbox, db: Session
):
    user = make_user()
    user.password_hash = None  # conta criada por login social
    db.commit()
    assert login().status_code == 401

    _forgot(client)
    assert _reset(client, _token_from(outbox[0])).status_code == 204
    assert login(password=NEW_PASSWORD).status_code == 200
    me = client.get("/auth/me").json()
    assert me["has_password"] is True


def test_usuario_inexistente_apos_pedido(client: TestClient, make_user, outbox, db: Session):
    user = make_user()
    _forgot(client)
    token = _token_from(outbox[0])
    user_row = db.get(User, user.id)
    assert user_row is not None
    user_row.is_active = False
    db.commit()
    assert _reset(client, token).status_code == 400
