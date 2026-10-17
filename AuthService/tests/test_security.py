import logging
import re
import shutil
import subprocess
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.core.logger import RedactingFilter
from tests.conftest import APP_ORIGIN, PASSWORD
from tests.helpers import REFRESH_COOKIE, access_token_from, refresh_token_from

ROOT = Path(__file__).resolve().parent.parent

# ── CSRF (defesa por Origin, além de SameSite=Lax) ───────────────────────────


def test_mutacao_com_cookie_e_origem_estranha_e_recusada(client: TestClient, make_user, login):
    make_user()
    login()
    response = client.post("/auth/refresh", headers={"Origin": "https://evil.example"})
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_mutacao_com_cookie_sem_origem_e_recusada(app: FastAPI, make_user, login):
    make_user()
    token = refresh_token_from(login())
    with TestClient(app, base_url="https://testserver") as no_origin:
        no_origin.cookies.set(REFRESH_COOKIE, token)
        assert no_origin.post("/auth/refresh").status_code == 403


def test_referer_confiavel_substitui_origin(app: FastAPI, make_user, login):
    make_user()
    token = refresh_token_from(login())
    with TestClient(app, base_url="https://testserver") as browser:
        browser.cookies.set(REFRESH_COOKIE, token)
        response = browser.post("/auth/refresh", headers={"Referer": f"{APP_ORIGIN}/login"})
        assert response.status_code == 200


def test_login_de_origem_estranha_e_recusado(client: TestClient, make_user):
    make_user()
    response = client.post(
        "/auth/login",
        json={"email": "usuario@empresa.com", "password": PASSWORD},
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403


def test_cliente_nao_navegador_com_bearer_nao_precisa_de_origin(app: FastAPI, make_user, login):
    make_user()
    access = access_token_from(login())
    with TestClient(app, base_url="https://testserver") as cli:
        response = cli.post("/auth/logout-all", headers={"Authorization": f"Bearer {access}"})
        assert response.status_code == 204


# ── Headers ──────────────────────────────────────────────────────────────────


def test_headers_de_seguranca_na_api(client: TestClient):
    response = client.get("/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"
    assert response.headers["content-security-policy"].startswith("default-src 'none'")
    assert response.headers["cache-control"] == "no-store"
    assert "strict-transport-security" not in response.headers  # só em produção


def test_hsts_em_producao(configure):
    configure(
        ENVIRONMENT="production",
        ARGON2_TIME_COST="2",
        ARGON2_MEMORY_COST_KIB="19456",
        EMAIL_BACKEND="disabled",  # memory é só para testes; produção recusa
    )
    from backend.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as prod:
        assert "max-age=31536000" in prod.get("/health").headers["strict-transport-security"]


def test_cors_desligado_por_padrao_e_explicito_quando_configurado(client: TestClient, configure):
    preflight = {"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"}
    response = client.options("/auth/login", headers=preflight)
    assert "access-control-allow-origin" not in response.headers

    configure(CORS_ALLOWED_ORIGINS="https://painel.test")
    from backend.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as with_cors:
        allowed = with_cors.options(
            "/auth/login",
            headers={"Origin": "https://painel.test", "Access-Control-Request-Method": "POST"},
        )
        denied = with_cors.options("/auth/login", headers=preflight)
    assert allowed.headers["access-control-allow-origin"] == "https://painel.test"
    assert allowed.headers["access-control-allow-credentials"] == "true"
    assert "access-control-allow-origin" not in denied.headers


# ── Logs ─────────────────────────────────────────────────────────────────────


def test_logs_nao_contem_senha_nem_tokens(client: TestClient, make_user, caplog):
    make_user()
    caplog.set_level(logging.DEBUG)

    login_response = client.post(
        "/auth/login", json={"email": "usuario@empresa.com", "password": PASSWORD}
    )
    refresh_response = client.post("/auth/refresh")
    client.post("/auth/login", json={"email": "usuario@empresa.com", "password": "errada-errada"})
    client.post("/auth/logout")

    secrets_seen = {
        PASSWORD,
        "errada-errada",
        access_token_from(login_response),
        refresh_token_from(login_response),
        access_token_from(refresh_response),
        refresh_token_from(refresh_response),
    }
    logged = "\n".join(record.getMessage() for record in caplog.records)
    assert "login_succeeded" in logged and "refresh_succeeded" in logged
    for secret in secrets_seen:
        assert secret not in logged
    assert "usuario@empresa.com" not in logged  # email aparece só como fingerprint


def test_filtro_de_redacao_mascara_segredos_e_quebras_de_linha():
    record = logging.LogRecord(
        "t",
        logging.INFO,
        __file__,
        1,
        "Authorization: Bearer abc.def password=hunter2 token eyJa.eyJb.sig\nfalso INFO",
        None,
        None,
    )
    RedactingFilter().filter(record)
    message = record.getMessage()
    assert "hunter2" not in message and "eyJa" not in message and "abc.def" not in message
    assert "\n" not in message


# ── Repositório e erros ──────────────────────────────────────────────────────


def test_nenhum_segredo_versionado():
    git = shutil.which("git") or "git"
    tracked = subprocess.run(  # noqa: S603  argumentos fixos, sem entrada externa
        [git, "ls-files"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.split()
    suspicious = re.compile(
        r"-----BEGIN [A-Z ]*PRIVATE KEY-----|SECRET_KEY=[0-9a-f]{32,}|ghp_[A-Za-z0-9]{36}"
    )
    offenders = [
        path
        for path in tracked
        if path.endswith(
            (".py", ".env", ".example", ".yml", ".yaml", ".toml", ".ini", ".md", ".txt")
        )
        and suspicious.search((ROOT / path).read_text(encoding="utf-8", errors="ignore"))
    ]
    assert offenders == []
    assert ".env" not in tracked
    assert not any(path.endswith(".pem") for path in tracked)


def test_erro_inesperado_nao_vaza_detalhes(app: FastAPI):
    @app.get("/auth/_explode")
    def explode() -> None:
        raise RuntimeError("detalhe interno: conexão postgres://usuario:senha@db")

    # O frontend é montado em "/" e captura tudo o que vier depois: a rota vai para o início.
    app.router.routes.insert(0, app.router.routes.pop())

    with TestClient(app, raise_server_exceptions=False) as failing:
        response = failing.get("/auth/_explode")
    assert response.status_code == 500
    assert response.json() == {"error": {"code": "INTERNAL_ERROR", "message": "Erro interno"}}


def test_rota_inexistente_usa_formato_padrao(client: TestClient):
    response = client.get("/auth/nao-existe")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


@pytest.mark.parametrize("path", ["/docs", "/openapi.json"])
def test_openapi_pode_ser_desligado(configure, path: str):
    configure(OPENAPI_ENABLED="false")
    from backend.main import create_app

    with TestClient(create_app()) as no_docs:
        assert no_docs.get(path).status_code == 404
