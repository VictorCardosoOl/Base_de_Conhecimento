"""Usuário (username único) e nome de exibição: cadastro, disponibilidade e busca (ADR-0011)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend import cli
from backend.models.user import Role, User
from tests.conftest import PASSWORD, TERMS

NEW = {
    "email": "maria@empresa.com",
    "password": "uma-senha-bem-longa",
    "username": "  Maria.Silva ",
    "display_name": "  Maria da Silva ",
    **TERMS,
}


@pytest.fixture
def registration_on(configure) -> None:
    configure(PUBLIC_REGISTRATION_ENABLED="true")


@pytest.fixture
def admin(client: TestClient, make_user) -> User:
    user = make_user(email="admin@empresa.com", role=Role.ADMIN, username="admin")
    response = client.post("/auth/login", json={"email": user.email, "password": PASSWORD})
    assert response.status_code == 200
    return user


def _count_users(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


# ── Cadastro ─────────────────────────────────────────────────────────────────


def test_cadastro_grava_usuario_normalizado_e_nome(client: TestClient, registration_on):
    response = client.post("/auth/register", json=NEW)

    assert response.status_code == 201
    user = response.json()["user"]
    assert user["username"] == "maria.silva"
    assert user["display_name"] == "Maria da Silva"
    me = client.get("/auth/me").json()
    assert (me["username"], me["display_name"]) == ("maria.silva", "Maria da Silva")


@pytest.mark.parametrize("missing", ["username", "display_name"])
def test_cadastro_exige_usuario_e_nome(client: TestClient, registration_on, db, missing):
    body = {key: value for key, value in NEW.items() if key != missing}
    response = client.post("/auth/register", json=body)

    assert response.status_code == 400
    assert missing in {detail["field"] for detail in response.json()["error"]["details"]}
    assert _count_users(db) == 0


@pytest.mark.parametrize(
    "username",
    ["ab", "a" * 31, "-maria", ".maria", "maria silva", "maria@silva", "joão", ""],
)
def test_cadastro_rejeita_usuario_fora_do_formato(client: TestClient, registration_on, username):
    response = client.post("/auth/register", json={**NEW, "username": username})
    assert response.status_code == 400


@pytest.mark.parametrize("display_name", ["", "   ", "x" * 101])
def test_cadastro_rejeita_nome_vazio_ou_longo(client: TestClient, registration_on, display_name):
    response = client.post("/auth/register", json={**NEW, "display_name": display_name})
    assert response.status_code == 400


def test_nome_aceita_qualquer_conteudo_e_pode_repetir(client: TestClient, registration_on):
    name = "Zé d'Ávila 🚀 <b>"
    first = client.post("/auth/register", json={**NEW, "display_name": name})
    second = client.post(
        "/auth/register",
        json={**NEW, "email": "outra@empresa.com", "username": "outra", "display_name": name},
    )
    assert first.status_code == second.status_code == 201
    assert second.json()["user"]["display_name"] == name


def test_usuario_duplicado_retorna_409_com_o_campo(client: TestClient, registration_on, db):
    assert client.post("/auth/register", json=NEW).status_code == 201

    duplicate = client.post(
        "/auth/register", json={**NEW, "email": "outra@empresa.com", "username": "MARIA.SILVA"}
    )

    assert duplicate.status_code == 409
    error = duplicate.json()["error"]
    assert error["code"] == "CONFLICT"
    assert error["details"] == [{"field": "username", "message": error["message"]}]
    assert _count_users(db) == 1


def test_email_duplicado_aponta_o_campo_email(client: TestClient, registration_on):
    assert client.post("/auth/register", json=NEW).status_code == 201
    duplicate = client.post("/auth/register", json={**NEW, "username": "outro.nome"})
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["details"][0]["field"] == "email"


def test_banco_garante_unicidade_do_usuario(db: Session, make_user):
    make_user(email="a@empresa.com", username="mesmo")
    db.add(
        User(
            email="b@empresa.com",
            username="mesmo",
            display_name="B",
            password_hash="x",
            role=Role.USER.value,
        )
    )
    with pytest.raises(IntegrityError, match="uq_users_username"):
        db.commit()
    db.rollback()


def test_banco_rejeita_usuario_fora_do_formato(db: Session):
    db.add(
        User(
            email="b@empresa.com",
            username="Maiuscula",
            display_name="B",
            password_hash="x",
            role=Role.USER.value,
        )
    )
    with pytest.raises(IntegrityError, match="ck_users_username_format"):
        db.commit()
    db.rollback()


# ── Disponibilidade ──────────────────────────────────────────────────────────


def test_disponibilidade_livre_ocupado_e_invalido(client: TestClient, make_user):
    make_user(email="maria@empresa.com", username="maria.silva")

    free = client.get("/auth/username-available", params={"username": "Joao.Souza"})
    taken = client.get("/auth/username-available", params={"username": " MARIA.SILVA "})
    invalid = client.get("/auth/username-available", params={"username": "jo"})

    assert free.json() == {"username": "joao.souza", "available": True, "reason": None}
    assert taken.json() == {"username": "maria.silva", "available": False, "reason": "taken"}
    assert invalid.json() == {"username": "jo", "available": False, "reason": "invalid"}


def test_disponibilidade_tem_limite_por_ip(client: TestClient, configure):
    configure(USERNAME_CHECK_RATE_LIMIT_ATTEMPTS="2")
    statuses = [
        client.get("/auth/username-available", params={"username": f"nome{i}"}).status_code
        for i in range(3)
    ]
    assert statuses == [200, 200, 429]


# ── Administração ────────────────────────────────────────────────────────────


def test_admin_cria_com_usuario_e_nome(client: TestClient, admin: User):
    response = client.post(
        "/admin/users",
        json={
            "email": "novo@empresa.com",
            "password": "senha-temporaria-longa",
            "username": "Novo.Colega",
            "display_name": "Novo Colega",
        },
    )
    assert response.status_code == 201
    assert response.json()["username"] == "novo.colega"
    assert response.json()["display_name"] == "Novo Colega"


def test_admin_nao_cria_usuario_repetido(client: TestClient, admin: User):
    response = client.post(
        "/admin/users",
        json={
            "email": "novo@empresa.com",
            "password": "senha-temporaria-longa",
            "username": "ADMIN",
            "display_name": "Outro",
        },
    )
    assert response.status_code == 409
    assert response.json()["error"]["details"][0]["field"] == "username"


def _search(client: TestClient, term: str) -> list[str]:
    response = client.get("/admin/users", params={"q": term})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == len(body["items"])
    return sorted(item["username"] for item in body["items"])


def test_busca_por_usuario_nome_e_email(client: TestClient, admin: User, make_user):
    make_user(email="ana@empresa.com", username="ana.souza", display_name="Ana Souza")
    make_user(email="bruno@outra.org", username="bruno", display_name="Bruno Lima")
    make_user(email="carla@empresa.com", username="carla_100", display_name="Carla Dias")

    assert _search(client, "SOUZA") == ["ana.souza"]  # usuário e nome
    assert _search(client, "lima") == ["bruno"]  # só no nome
    assert _search(client, "outra.org") == ["bruno"]  # só no email
    assert _search(client, "empresa") == ["admin", "ana.souza", "carla_100"]
    assert _search(client, "   ") == ["admin", "ana.souza", "bruno", "carla_100"]  # sem filtro
    assert _search(client, "ninguém") == []


def test_busca_trata_curingas_como_texto(client: TestClient, admin: User, make_user):
    make_user(email="ana@empresa.com", username="ana_souza", display_name="Ana 100%")
    make_user(email="anaxsouza@empresa.com", username="anaxsouza", display_name="Outra")

    assert _search(client, "%") == ["ana_souza"]
    assert _search(client, "ana_") == ["ana_souza"]  # "_" não casa com "x"
    assert _search(client, "\\") == []


def test_busca_exige_admin(client: TestClient, make_user):
    make_user(email="editor@empresa.com", role=Role.EDITOR)
    client.post("/auth/login", json={"email": "editor@empresa.com", "password": PASSWORD})
    assert client.get("/admin/users", params={"q": "a"}).status_code == 403


def test_pedidos_de_editor_mostram_usuario_e_nome(client: TestClient, admin: User, make_user, app):
    make_user(email="leitor@empresa.com", username="leitor", display_name="Leitor")
    with TestClient(app, base_url="https://testserver", headers=client.headers) as reader:
        reader.post("/auth/login", json={"email": "leitor@empresa.com", "password": PASSWORD})
        assert reader.post("/auth/role-request").status_code == 201

    item = client.get("/admin/role-requests").json()["items"][0]
    assert (item["username"], item["display_name"]) == ("leitor", "Leitor")


# ── CLI ──────────────────────────────────────────────────────────────────────


def test_cli_rejeita_usuario_invalido(monkeypatch, db: Session):
    monkeypatch.setenv("AUTHSERVICE_NEW_USER_PASSWORD", "uma-senha-bem-longa")
    with pytest.raises(SystemExit, match="usuário inválido"):
        cli.create_user("x@empresa.com", "x", "X", Role.USER)
    cli.create_user("x@empresa.com", "Pessoa.X", "Pessoa X", Role.USER)
    assert db.scalar(select(User.username)) == "pessoa.x"
