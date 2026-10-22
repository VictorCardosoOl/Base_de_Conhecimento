"""Regressões da auditoria de autenticação (2026-10-14).

Cada teste corresponde a um achado do relatório docs/AUDITORIA_AUTENTICACAO.md:

- A1: limite de tentativas por conta, independente do IP (o IP pode ser forjado ou
  ser o do proxy);
- A2: IP inválido no X-Forwarded-For não derruba o login nem vai para o banco;
- A3: com a troca de senha pendente (senha definida por um admin), a sessão não grava
  nada além da própria troca;
- A4: avisos de implantação para configurações que anulam proteções;
- D1 (2026-10-15): os limites de login contam só as tentativas que falham. Antes, um
  login correto também consumia o limite: 10 logins corretos em 15 min bloqueavam a
  própria conta, e 30 por minuto de quaisquer pessoas (atrás do proxy) bloqueavam todos.
"""

from collections.abc import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.core.config import get_settings
from backend.main import create_app, deployment_warnings
from backend.models.session import UserSession
from backend.models.user import Role, User
from tests.conftest import APP_ORIGIN, PASSWORD

ARTICLE = "esocial-guia-completo"


def _client() -> TestClient:
    return TestClient(create_app(), base_url="https://testserver", headers={"Origin": APP_ORIGIN})


# ── A1: limite por conta, independente do IP ───────────────────────────────────


def test_ip_forjado_nao_permite_forca_bruta_numa_conta(configure, make_user, db: Session):
    """Atrás de proxy (TRUSTED_PROXY_COUNT=1), trocar o X-Forwarded-For a cada tentativa
    burlava o limite por IP+email. O limite por conta não depende do IP."""
    configure(TRUSTED_PROXY_COUNT="1", LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS="4")
    make_user(email="alvo@empresa.com")
    with _client() as c:
        statuses = [
            c.post(
                "/auth/login",
                json={"email": "alvo@empresa.com", "password": "senha-errada-123"},
                headers={"X-Forwarded-For": f"198.51.100.{i}"},
            ).status_code
            for i in range(1, 6)
        ]
        # Nem a senha correta passa durante o bloqueio da conta, de qualquer IP.
        correct = c.post(
            "/auth/login",
            json={"email": "alvo@empresa.com", "password": PASSWORD},
            headers={"X-Forwarded-For": "203.0.113.50"},
        )
    assert statuses == [401, 401, 401, 401, 429]
    assert correct.status_code == 429
    assert int(correct.headers["retry-after"]) >= 1


def test_limite_por_conta_nao_revela_se_o_email_existe(configure):
    configure(LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS="2", LOGIN_RATE_LIMIT_ATTEMPTS="100")
    with _client() as c:
        statuses = [
            c.post(
                "/auth/login", json={"email": "ninguem@empresa.com", "password": "x" * 12}
            ).status_code
            for _ in range(3)
        ]
    assert statuses == [401, 401, 429]


def test_limite_por_conta_nao_afeta_outras_contas(configure, make_user):
    configure(LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS="2", LOGIN_RATE_LIMIT_ATTEMPTS="100")
    make_user(email="outra@empresa.com")
    with _client() as c:
        for _ in range(3):
            c.post("/auth/login", json={"email": "alvo@empresa.com", "password": "x" * 12})
        ok = c.post("/auth/login", json={"email": "outra@empresa.com", "password": PASSWORD})
    assert ok.status_code == 200


# ── D1: só as falhas contam ────────────────────────────────────────────────────


def _login(c: TestClient, email: str, password: str, ip: str | None = None) -> int:
    headers = {"X-Forwarded-For": ip} if ip else {}
    return c.post(
        "/auth/login", json={"email": email, "password": password}, headers=headers
    ).status_code


def test_logins_corretos_nao_consomem_o_limite_da_conta(make_user):
    """Limite por conta padrão (10 em 15 min): 11 logins corretos seguidos passam."""
    make_user(email="frequente@empresa.com")
    with _client() as c:
        statuses = [_login(c, "frequente@empresa.com", PASSWORD) for _ in range(11)]
    assert statuses == [200] * 11


def test_logins_corretos_nao_esgotam_o_limite_por_ip(make_user):
    """Atrás do proxy todos têm o mesmo IP: 30 logins corretos não bloqueiam ninguém."""
    for i in range(3):
        make_user(email=f"pessoa{i}@empresa.com", username=f"pessoa{i}")
    with _client() as c:
        statuses = [_login(c, f"pessoa{i % 3}@empresa.com", PASSWORD) for i in range(31)]
        errada = _login(c, "pessoa0@empresa.com", "senha-errada-123")
    assert statuses == [200] * 31
    assert errada == 401  # uma falha comum, não 429


def test_falhas_continuam_bloqueando_por_ip_e_por_conta(configure, make_user):
    configure(
        TRUSTED_PROXY_COUNT="1",
        LOGIN_RATE_LIMIT_IP_ATTEMPTS="3",
        LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS="3",
        LOGIN_RATE_LIMIT_ATTEMPTS="100",
    )
    make_user(email="alvo@empresa.com")
    make_user(email="outra@empresa.com", username="outra")
    with _client() as c:
        # Por IP: 3 falhas de um IP (emails diferentes) bloqueiam esse IP para todos.
        por_ip = [
            _login(c, f"x{i}@empresa.com", "senha-errada-123", "198.51.100.1") for i in range(3)
        ]
        ip_bloqueado = _login(c, "outra@empresa.com", PASSWORD, "198.51.100.1")
        # Por conta: 3 falhas de IPs diferentes bloqueiam a conta em qualquer IP.
        por_conta = [
            _login(c, "alvo@empresa.com", "senha-errada-123", f"203.0.113.{i}") for i in range(3)
        ]
        conta_bloqueada = _login(c, "alvo@empresa.com", PASSWORD, "203.0.113.200")
    assert por_ip == [401, 401, 401]
    assert ip_bloqueado == 429  # nem a senha correta passa durante o bloqueio
    assert por_conta == [401, 401, 401]
    assert conta_bloqueada == 429


def test_o_bloqueio_expira(configure, make_user, monkeypatch: pytest.MonkeyPatch):
    from datetime import UTC, datetime, timedelta

    import backend.core.rate_limit as rate_limit

    agora = [datetime(2026, 10, 15, 12, 0, 0, tzinfo=UTC)]

    class Relogio(datetime):
        @classmethod
        def now(cls, tz=None):  # type: ignore[no-untyped-def, override]
            return agora[0]

    monkeypatch.setattr(rate_limit, "datetime", Relogio)
    configure(LOGIN_RATE_LIMIT_ATTEMPTS="2", LOGIN_RATE_LIMIT_WINDOW_SECONDS="60")
    make_user(email="alvo@empresa.com")
    with _client() as c:
        falhas = [_login(c, "alvo@empresa.com", "senha-errada-123") for _ in range(2)]
        bloqueado = _login(c, "alvo@empresa.com", PASSWORD)
        agora[0] += timedelta(seconds=61)
        depois = _login(c, "alvo@empresa.com", PASSWORD)
    assert falhas == [401, 401]
    assert bloqueado == 429
    assert depois == 200


# ── A2: X-Forwarded-For inválido ───────────────────────────────────────────────


@pytest.mark.parametrize(
    "forwarded",
    ["x" * 200, "nao-e-ip", "1.2.3.4.5", "<script>", "999.1.1.1"],
)
def test_ip_invalido_no_proxy_nao_quebra_o_login(configure, make_user, db: Session, forwarded: str):
    configure(TRUSTED_PROXY_COUNT="1")
    make_user()
    with _client() as c:
        response = c.post(
            "/auth/login",
            json={"email": "usuario@empresa.com", "password": PASSWORD},
            headers={"X-Forwarded-For": forwarded},
        )
    assert response.status_code == 200
    ips = db.scalars(select(UserSession.ip_address)).all()
    assert forwarded not in ips  # cai para o IP da conexão, não grava lixo


def test_ip_valido_do_proxy_e_usado(configure, make_user, db: Session):
    configure(TRUSTED_PROXY_COUNT="1")
    make_user()
    with _client() as c:
        c.post(
            "/auth/login",
            json={"email": "usuario@empresa.com", "password": PASSWORD},
            headers={"X-Forwarded-For": "10.0.0.1, 2001:db8::7"},
        )
    assert db.scalars(select(UserSession.ip_address)).all() == ["2001:db8::7"]


# ── A3: troca de senha pendente ────────────────────────────────────────────────


@pytest.fixture
def pending(make_user: Callable[..., User], db: Session) -> Callable[..., TestClient]:
    """Conta com senha definida por um admin (must_change_password) e sessão aberta."""

    def factory(email: str = "nova@empresa.com", role: Role = Role.USER) -> TestClient:
        user = make_user(email=email, role=role)
        user.must_change_password = True
        db.commit()
        c = _client()
        c.__enter__()
        assert c.post("/auth/login", json={"email": email, "password": PASSWORD}).status_code == 200
        return c

    return factory


def test_troca_pendente_bloqueia_escrita_de_conteudo(pending):
    c = pending()
    attempts = [
        c.put(f"/content/articles/{ARTICLE}/rating", json={"value": 5}),
        c.post(f"/content/articles/{ARTICLE}/comments", json={"body": "Comentário qualquer"}),
        c.post(
            f"/content/articles/{ARTICLE}/corrections",
            json={"kind": "erro", "description": "Descrição com tamanho suficiente."},
        ),
        c.post("/auth/role-request"),
    ]
    for response in attempts:
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "PASSWORD_CHANGE_REQUIRED"
    c.__exit__(None, None, None)


def test_troca_pendente_permite_ler_trocar_a_senha_e_depois_escrever(pending):
    c = pending()
    assert c.get("/auth/me").json()["must_change_password"] is True
    assert c.get(f"/content/articles/{ARTICLE}/comments").status_code == 200
    changed = c.post(
        "/auth/password",
        json={"current_password": PASSWORD, "new_password": "uma-senha-nova-e-longa"},
    )
    assert changed.status_code == 204
    assert c.put(f"/content/articles/{ARTICLE}/rating", json={"value": 4}).status_code == 200
    c.__exit__(None, None, None)


def test_troca_pendente_bloqueia_a_api_administrativa(pending):
    c = pending(email="admin.novo@empresa.com", role=Role.ADMIN)
    response = c.get("/admin/users")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "PASSWORD_CHANGE_REQUIRED"
    assert c.post("/auth/logout").status_code == 204  # sair continua possível
    c.__exit__(None, None, None)


# ── A4: avisos de implantação ──────────────────────────────────────────────────


def test_avisos_de_implantacao(configure):
    configure(TRUSTED_PROXY_COUNT="0", OPENAPI_ENABLED="true")
    warnings = deployment_warnings(get_settings().model_copy(update={"ENVIRONMENT": "production"}))
    assert any("TRUSTED_PROXY_COUNT" in w for w in warnings)
    assert any("OPENAPI_ENABLED" in w for w in warnings)

    configure(TRUSTED_PROXY_COUNT="1", OPENAPI_ENABLED="false")
    quiet = get_settings().model_copy(update={"ENVIRONMENT": "production"})
    assert deployment_warnings(quiet) == []
    # Em desenvolvimento, nada a avisar.
    assert deployment_warnings(get_settings()) == []
