"""Cadastro público, pedidos de acesso de editor e usuários de teste (ADR-0010)."""

from collections.abc import Callable, Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend import cli
from backend.core.config import Settings
from backend.core.passwords import verify_password
from backend.models.role_request import RoleRequest
from backend.models.user import Role, User
from tests.conftest import APP_ORIGIN, BASE_ENV, PASSWORD, TERMS
from tests.helpers import ACCESS_COOKIE, set_cookies

NEW = {
    "email": "Nova.Pessoa@Empresa.com",
    "password": "uma-senha-bem-longa",
    "username": "nova.pessoa",
    "display_name": "Nova Pessoa",
    **TERMS,
}


@pytest.fixture
def new_client(app: FastAPI) -> Iterator[Callable[[], TestClient]]:
    opened: list[TestClient] = []

    def factory() -> TestClient:
        c = TestClient(app, base_url="https://testserver", headers={"Origin": APP_ORIGIN})
        c.__enter__()
        opened.append(c)
        return c

    yield factory
    for c in opened:
        c.__exit__(None, None, None)


@pytest.fixture
def registration_on(configure) -> None:
    configure(PUBLIC_REGISTRATION_ENABLED="true")


def _sign_in(c: TestClient, email: str, password: str = PASSWORD) -> None:
    assert c.post("/auth/login", json={"email": email, "password": password}).status_code == 200


def _count_users(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


# ── Cadastro público ─────────────────────────────────────────────────────────


def test_cadastro_desligado_por_padrao(client: TestClient, db: Session):
    response = client.post("/auth/register", json=NEW)
    assert response.status_code == 404
    assert _count_users(db) == 0


def test_cadastro_cria_user_e_ja_abre_a_sessao(client: TestClient, registration_on, db: Session):
    response = client.post("/auth/register", json=NEW)

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "nova.pessoa@empresa.com"
    assert body["user"]["role"] == "user"
    assert body["user"]["must_change_password"] is False  # a pessoa escolheu a própria senha
    assert ACCESS_COOKIE in set_cookies(response)
    assert NEW["password"] not in response.text
    assert client.get("/auth/me").json()["role"] == "user"


@pytest.mark.parametrize("role", ["admin", "editor", "user"])
def test_cadastro_nunca_aceita_papel_no_corpo(client: TestClient, registration_on, db, role):
    response = client.post("/auth/register", json={**NEW, "role": role})
    assert response.status_code == 400
    assert _count_users(db) == 0


def test_cadastro_valida_email_senha_e_duplicidade(client: TestClient, registration_on):
    assert client.post("/auth/register", json={**NEW, "password": "curta"}).status_code == 400
    assert client.post("/auth/register", json={**NEW, "email": "sem-arroba"}).status_code == 400
    assert client.post("/auth/register", json=NEW).status_code == 201
    duplicate = client.post("/auth/register", json={**NEW, "email": "NOVA.PESSOA@empresa.com"})
    assert duplicate.status_code == 409


def test_cadastro_tem_limite_por_ip(client: TestClient, configure, db: Session):
    configure(PUBLIC_REGISTRATION_ENABLED="true", REGISTER_RATE_LIMIT_IP_ATTEMPTS="2")
    statuses = [
        client.post(
            "/auth/register",
            json={**NEW, "email": f"p{i}@empresa.com", "username": f"pessoa{i}"},
        ).status_code
        for i in range(3)
    ]
    assert statuses == [201, 201, 429]
    assert _count_users(db) == 2


def test_cadastro_exige_origem_confiavel(client: TestClient, registration_on, db: Session):
    response = client.post("/auth/register", json=NEW, headers={"Origin": "https://evil.example"})
    assert response.status_code == 403
    assert _count_users(db) == 0


# ── Pedido de acesso de editor ───────────────────────────────────────────────


def test_usuario_pede_acesso_de_editor_uma_vez(client: TestClient, make_user, login):
    make_user()
    login()
    assert client.get("/auth/role-request").json() is None

    created = client.post("/auth/role-request")
    assert created.status_code == 201
    assert created.json()["status"] == "pending"
    assert created.json()["requested_role"] == "editor"

    again = client.post("/auth/role-request")
    assert again.status_code == 409
    assert client.get("/auth/role-request").json()["status"] == "pending"
    # Pedir não muda nada no papel.
    assert client.get("/auth/me").json()["role"] == "user"


@pytest.mark.parametrize("role", [Role.EDITOR, Role.ADMIN])
def test_quem_ja_e_editor_ou_admin_nao_pede(client: TestClient, make_user, role):
    make_user(email="alguem@empresa.com", role=role)
    _sign_in(client, "alguem@empresa.com")
    assert client.post("/auth/role-request").status_code == 400


def test_pedido_exige_sessao(client: TestClient):
    client.cookies.clear()
    assert client.post("/auth/role-request").status_code == 401
    assert client.get("/auth/role-request").status_code == 401


def _pending_request(new_client, make_user) -> tuple[TestClient, User]:
    user = make_user(email="pessoa@empresa.com")
    browser = new_client()
    _sign_in(browser, user.email)
    assert browser.post("/auth/role-request").status_code == 201
    return browser, user


def test_editor_lista_e_aprova_usuario_vira_editor(new_client, make_user, db: Session):
    requester, user = _pending_request(new_client, make_user)
    editor = make_user(email="editor@empresa.com", role=Role.EDITOR)
    decider = new_client()
    _sign_in(decider, editor.email)

    listing = decider.get("/admin/role-requests")
    assert listing.status_code == 200
    [item] = listing.json()["items"]
    assert item["email"] == "pessoa@empresa.com" and item["status"] == "pending"

    approved = decider.post(f"/admin/role-requests/{item['id']}/approve")
    assert approved.status_code == 200 and approved.json()["status"] == "approved"

    db.expire_all()
    assert db.get(User, user.id).role == "editor"  # type: ignore[union-attr]
    request = db.get(RoleRequest, item["id"])
    assert request is not None and request.decided_by == editor.id
    # A sessão antiga (com papel user) caiu; no novo login, é editor.
    assert requester.get("/auth/me").status_code == 401
    _sign_in(requester, user.email)
    assert requester.get("/auth/me").json()["role"] == "editor"
    # Decidido não se decide de novo.
    assert decider.post(f"/admin/role-requests/{item['id']}/approve").status_code == 409
    assert decider.get("/admin/role-requests").json()["total"] == 0


def test_admin_recusa_e_usuario_pode_pedir_de_novo(new_client, make_user, db: Session):
    requester, user = _pending_request(new_client, make_user)
    admin = make_user(email="admin@empresa.com", role=Role.ADMIN)
    decider = new_client()
    _sign_in(decider, admin.email)
    [item] = decider.get("/admin/role-requests").json()["items"]

    rejected = decider.post(f"/admin/role-requests/{item['id']}/reject")

    assert rejected.status_code == 200 and rejected.json()["status"] == "rejected"
    db.expire_all()
    assert db.get(User, user.id).role == "user"  # type: ignore[union-attr]
    assert requester.get("/auth/role-request").json()["status"] == "rejected"
    assert requester.post("/auth/role-request").status_code == 201


def test_usuario_comum_nao_ve_nem_decide_pedidos(new_client, make_user):
    requester, _ = _pending_request(new_client, make_user)
    assert requester.get("/admin/role-requests").status_code == 403
    other = make_user(email="outra@empresa.com")
    browser = new_client()
    _sign_in(browser, other.email)
    decider = make_user(email="editor@empresa.com", role=Role.EDITOR)
    editor_browser = new_client()
    _sign_in(editor_browser, decider.email)
    [item] = editor_browser.get("/admin/role-requests").json()["items"]
    # Nem o próprio solicitante nem outro usuário comum aprovam.
    for c in (requester, browser):
        assert c.post(f"/admin/role-requests/{item['id']}/approve").status_code == 403


def test_pedido_de_conta_desativada_nao_promove(new_client, make_user, db: Session):
    _, user = _pending_request(new_client, make_user)
    admin = make_user(email="admin@empresa.com", role=Role.ADMIN)
    decider = new_client()
    _sign_in(decider, admin.email)
    [item] = decider.get("/admin/role-requests").json()["items"]
    assert decider.patch(f"/admin/users/{user.id}", json={"is_active": False}).status_code == 200

    assert decider.post(f"/admin/role-requests/{item['id']}/approve").status_code == 409
    db.expire_all()
    assert db.get(User, user.id).role == "user"  # type: ignore[union-attr]


def test_pedido_inexistente_404(new_client, make_user):
    admin = make_user(email="admin@empresa.com", role=Role.ADMIN)
    decider = new_client()
    _sign_in(decider, admin.email)
    url = "/admin/role-requests/00000000-0000-0000-0000-000000000000/approve"
    assert decider.post(url).status_code == 404


# ── Usuários de teste ────────────────────────────────────────────────────────

SEED_ENV = {
    "SEED_ADMIN_EMAIL": "admin@teste.local",
    "SEED_ADMIN_PASSWORD": "senha-admin-de-teste",
    "SEED_EDITOR_EMAIL": "editor@teste.local",
    "SEED_EDITOR_PASSWORD": "senha-editor-de-teste",
    "SEED_USER_EMAIL": "user@teste.local",
    "SEED_USER_PASSWORD": "senha-user-de-teste",
}


def test_seed_desligado_nao_cria_nada(configure, db: Session, monkeypatch):
    for name, value in SEED_ENV.items():
        monkeypatch.setenv(name, value)
    configure(SEED_DEV_USERS="false")
    cli.seed_dev_users()
    assert _count_users(db) == 0


def test_seed_cria_um_por_papel_e_e_idempotente(configure, db: Session, monkeypatch, capsys):
    for name, value in SEED_ENV.items():
        monkeypatch.setenv(name, value)
    configure(SEED_DEV_USERS="true")

    cli.seed_dev_users()
    cli.seed_dev_users()

    rows = db.execute(select(User.email, User.role, User.username, User.display_name)).all()
    assert {tuple(row) for row in rows} == {
        ("admin@teste.local", "admin", "admin", "Administrador"),
        ("editor@teste.local", "editor", "editor", "Editor"),
        ("user@teste.local", "user", "leitor", "Leitor"),
    }
    out = capsys.readouterr().out
    assert "já existe" in out
    assert not any(value in out for name, value in SEED_ENV.items() if name.endswith("PASSWORD"))


def test_seed_nao_altera_conta_existente(configure, db: Session, monkeypatch, make_user):
    existing = make_user(email="admin@teste.local", role=Role.USER)
    for name, value in SEED_ENV.items():
        monkeypatch.setenv(name, value)
    configure(SEED_DEV_USERS="true")

    cli.seed_dev_users()

    db.refresh(existing)
    assert existing.role == "user"  # não promove quem já existe
    assert verify_password(existing.password_hash, PASSWORD)  # nem troca a senha


def test_seed_e_recusado_em_producao():
    env = {**BASE_ENV, "ENVIRONMENT": "production", "SEED_DEV_USERS": "true"}
    with pytest.raises(ValidationError, match="SEED_DEV_USERS"):
        Settings(
            _env_file=None,  # type: ignore[call-arg]
            **{k: v for k, v in env.items() if k != "AUTHSERVICE_ENV_FILE"},
        )
