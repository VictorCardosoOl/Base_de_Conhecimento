from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.models.user import Role, User
from tests.conftest import PASSWORD

NEW_USER = {
    "email": "Nova.Pessoa@Empresa.com",
    "password": "uma-senha-bem-longa",
    "role": "user",
    "username": "nova.pessoa",
    "display_name": "Nova Pessoa",
}


def _login_as(client: TestClient, make_user, role: Role) -> None:
    email = f"{role.value}@empresa.com"
    make_user(email=email, role=role)
    assert (
        client.post("/auth/login", json={"email": email, "password": PASSWORD}).status_code == 200
    )


def test_sem_autenticacao_recebe_401(client: TestClient):
    client.cookies.clear()
    assert client.get("/admin/users").status_code == 401
    assert client.post("/admin/users", json=NEW_USER).status_code == 401


def test_usuario_comum_recebe_403(client: TestClient, make_user, db: Session):
    _login_as(client, make_user, Role.USER)

    assert client.get("/admin/users").status_code == 403
    response = client.post("/admin/users", json=NEW_USER)

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
    assert db.scalar(select(func.count()).select_from(User)) == 1  # nada foi criado


def test_admin_cria_e_lista_usuarios(client: TestClient, make_user):
    _login_as(client, make_user, Role.ADMIN)

    created = client.post("/admin/users", json=NEW_USER)
    listing = client.get("/admin/users")

    assert created.status_code == 201
    body = created.json()
    assert body["email"] == "nova.pessoa@empresa.com"  # normalizado
    assert body["role"] == "user" and body["is_active"] is True
    assert body["must_change_password"] is True  # senha definida pelo admin
    assert NEW_USER["password"] not in created.text and "hash" not in created.text
    assert listing.status_code == 200
    assert listing.json()["total"] == 2


def test_email_duplicado_retorna_409(client: TestClient, make_user):
    _login_as(client, make_user, Role.ADMIN)
    assert client.post("/admin/users", json=NEW_USER).status_code == 201
    duplicate = client.post("/admin/users", json={**NEW_USER, "email": "NOVA.PESSOA@empresa.com"})
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "CONFLICT"


def test_senha_fora_da_politica_retorna_400(client: TestClient, make_user):
    _login_as(client, make_user, Role.ADMIN)
    for password in ("curta", "x" * 257):
        response = client.post("/admin/users", json={**NEW_USER, "password": password})
        assert response.status_code == 400
        assert password not in response.text


def test_papel_invalido_e_campos_extras_sao_rejeitados(client: TestClient, make_user):
    _login_as(client, make_user, Role.ADMIN)
    assert client.post("/admin/users", json={**NEW_USER, "role": "superadmin"}).status_code == 400
    extra = {**NEW_USER, "id": "00000000-0000-0000-0000-000000000000", "is_active": False}
    assert client.post("/admin/users", json=extra).status_code == 400


def test_papel_vem_do_banco_e_nao_do_token_antigo(client: TestClient, make_user, db: Session):
    # Rebaixar um admin tem efeito imediato na autorização, mesmo com access token ainda válido.
    _login_as(client, make_user, Role.ADMIN)
    admin = db.scalar(select(User))
    assert admin is not None
    admin.role = Role.USER.value
    db.commit()
    assert client.get("/admin/users").status_code == 403


def test_lista_mostra_os_mais_recentes_primeiro(client: TestClient, make_user):
    _login_as(client, make_user, Role.ADMIN)
    for i in range(3):
        created = client.post(
            "/admin/users",
            json={**NEW_USER, "email": f"p{i}@empresa.com", "username": f"pessoa{i}"},
        )
        assert created.status_code == 201

    emails = [u["email"] for u in client.get("/admin/users?limit=2").json()["items"]]

    assert emails == ["p2@empresa.com", "p1@empresa.com"]
