from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.core import passwords
from tests.conftest import PASSWORD, TERMS
from tests.helpers import ACCESS_COOKIE, REFRESH_COOKIE, set_cookies


def test_login_sucesso_define_cookies_e_nao_devolve_tokens(client: TestClient, make_user, login):
    user = make_user()

    response = login()

    assert response.status_code == 200
    body = response.json()
    assert body["user"] == {
        "id": str(user.id),
        "email": "usuario@empresa.com",
        "username": "usuario",
        "display_name": "Pessoa de Teste",
        "role": "user",
        "must_change_password": False,
        "email_verified": False,
        "has_password": True,
    }
    assert "access_token_expires_at" in body
    assert "token" not in response.text.lower().replace("access_token_expires_at", "")

    cookies = set_cookies(response)
    access, refresh = cookies[ACCESS_COOKIE], cookies[REFRESH_COOKIE]
    for cookie in (access, refresh):
        assert cookie["httponly"] is True
        assert cookie["secure"] is True
        assert cookie["samesite"].lower() == "lax"
        assert "domain" not in cookie
    assert access["path"] == "/"
    assert refresh["path"] == "/auth"
    assert int(access["max-age"]) <= 600
    assert int(refresh["max-age"]) <= 86400


def test_login_normaliza_email(client: TestClient, make_user, login):
    make_user(email="usuario@empresa.com")
    assert login(email="  USUARIO@Empresa.com ").status_code == 200


def test_senha_incorreta_e_email_inexistente_tem_a_mesma_resposta(
    client: TestClient, make_user, login
):
    make_user()

    wrong_password = login(password="senha-errada-123")
    unknown_email = login(email="ninguem@empresa.com")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()
    assert wrong_password.json()["error"]["code"] == "INVALID_CREDENTIALS"
    assert set_cookies(wrong_password) == set_cookies(unknown_email) == {}


def test_email_inexistente_executa_verificacao_de_hash(client: TestClient, login):
    # Equalização de tempo: sem usuário, uma verificação Argon2 completa ainda acontece.
    with patch.object(passwords, "verify_password", wraps=passwords.verify_password) as spy:
        assert login(email="ninguem@empresa.com").status_code == 401
    assert spy.call_count == 1


def test_usuario_desativado_nao_loga_e_nao_e_revelado(client: TestClient, make_user, login):
    make_user(is_active=False)
    response = login()
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_rate_limit_por_ip_e_email(client: TestClient, make_user, login):
    make_user()
    for _ in range(5):
        assert login(password="senha-errada-123").status_code == 401

    blocked = login(password=PASSWORD)  # nem a senha correta passa durante o bloqueio

    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "RATE_LIMITED"
    assert int(blocked.headers["retry-after"]) >= 1


def test_rate_limit_por_ip_bloqueia_varios_emails(client: TestClient, configure, login):
    configure(LOGIN_RATE_LIMIT_IP_ATTEMPTS="3")
    from backend.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as fresh:
        statuses = [
            fresh.post(
                "/auth/login", json={"email": f"u{i}@empresa.com", "password": "x" * 12}
            ).status_code
            for i in range(4)
        ]
    assert statuses == [401, 401, 401, 429]


def test_cadastro_publico_nao_existe(client: TestClient):
    payload = {
        "email": "novo@empresa.com",
        "password": "senha-muito-longa-1",
        "username": "novo",
        "display_name": "Novo",
        **TERMS,
    }
    assert client.post("/register", json=payload).status_code in (404, 405)
    assert client.post("/auth/register", json=payload).status_code in (404, 405)
    assert client.post("/token", data={"username": "a", "password": "b"}).status_code in (404, 405)


def test_login_rejeita_campos_extras_e_nao_ecoa_senha(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "a@empresa.com", "password": "segredo-nao-ecoar", "role": "admin"},
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert "segredo-nao-ecoar" not in response.text
