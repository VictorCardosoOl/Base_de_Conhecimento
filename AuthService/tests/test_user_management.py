"""Gestão de usuários: papel editor, alteração de papel/ativação, redefinição e troca de senha."""

import logging
import uuid
from collections.abc import Callable, Iterator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.core.errors import ConflictError
from backend.models.session import UserSession
from backend.models.user import Role, User
from backend.services.user_service import UserService
from tests.conftest import APP_ORIGIN, PASSWORD

NEW_PASSWORD = "outra-senha-bem-longa"
TEMP_PASSWORD = "temporaria-definida-pelo-admin"


@pytest.fixture
def new_client(app: FastAPI) -> Iterator[Callable[[], TestClient]]:
    """Clientes extras: cada um é um navegador com seus próprios cookies."""
    opened: list[TestClient] = []

    def factory() -> TestClient:
        c = TestClient(app, base_url="https://testserver", headers={"Origin": APP_ORIGIN})
        c.__enter__()
        opened.append(c)
        return c

    yield factory
    for c in opened:
        c.__exit__(None, None, None)


def _sign_in(c: TestClient, email: str, password: str = PASSWORD) -> None:
    response = c.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text


@pytest.fixture
def admin(client: TestClient, make_user) -> User:
    user = make_user(email="admin@empresa.com", role=Role.ADMIN)
    _sign_in(client, user.email)
    return user


# ── Papel editor ─────────────────────────────────────────────────────────────


def test_papel_editor_existe_e_nao_gerencia_usuarios(make_user, new_client):
    editor = make_user(email="editor@empresa.com", role=Role.EDITOR)
    c = new_client()
    _sign_in(c, editor.email)

    assert c.get("/auth/me").json()["role"] == "editor"
    assert c.get("/admin/users").status_code == 403
    created = c.post(
        "/admin/users",
        json={
            "email": "x@empresa.com",
            "password": PASSWORD,
            "username": "pessoa.x",
            "display_name": "X",
        },
    )
    assert created.status_code == 403


def test_banco_rejeita_papel_desconhecido(db: Session, make_user):
    user = make_user()
    user.role = "superadmin"
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


# ── Alterar papel / ativação ─────────────────────────────────────────────────


def test_admin_promove_usuario_a_editor_e_sessoes_dele_sao_revogadas(
    client: TestClient, admin: User, make_user, new_client
):
    target = make_user(email="pessoa@empresa.com")
    target_browser = new_client()
    _sign_in(target_browser, target.email)

    response = client.patch(f"/admin/users/{target.id}", json={"role": "editor"})

    assert response.status_code == 200
    assert response.json()["role"] == "editor"
    # O access token antigo carregava role=user: a sessão precisa ser renovada por login.
    assert target_browser.get("/auth/me").status_code == 401
    _sign_in(target_browser, target.email)
    assert target_browser.get("/auth/me").json()["role"] == "editor"


def test_papel_igual_nao_derruba_sessoes(client: TestClient, admin: User, make_user, new_client):
    target = make_user(email="pessoa@empresa.com")
    target_browser = new_client()
    _sign_in(target_browser, target.email)

    assert client.patch(f"/admin/users/{target.id}", json={"role": "user"}).status_code == 200
    assert target_browser.get("/auth/me").status_code == 200


def test_desativar_revoga_sessoes_e_bloqueia_login_reativar_libera(
    client: TestClient, admin: User, make_user, new_client
):
    target = make_user(email="pessoa@empresa.com")
    target_browser = new_client()
    _sign_in(target_browser, target.email)

    off = client.patch(f"/admin/users/{target.id}", json={"is_active": False})
    assert off.status_code == 200 and off.json()["is_active"] is False
    assert target_browser.get("/auth/me").status_code == 401
    denied = target_browser.post("/auth/login", json={"email": target.email, "password": PASSWORD})
    assert denied.status_code == 401
    assert denied.json()["error"]["code"] == "INVALID_CREDENTIALS"  # não revela a desativação

    assert client.patch(f"/admin/users/{target.id}", json={"is_active": True}).status_code == 200
    _sign_in(target_browser, target.email)


def test_admin_nao_altera_o_proprio_papel_nem_se_desativa(client: TestClient, admin: User):
    for body in ({"role": "user"}, {"role": "editor"}, {"is_active": False}):
        response = client.patch(f"/admin/users/{admin.id}", json=body)
        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"
    # Sem mudança efetiva, não há o que bloquear.
    assert client.patch(f"/admin/users/{admin.id}", json={"is_active": True}).status_code == 200
    assert client.get("/auth/me").status_code == 200


def test_admin_pode_rebaixar_outro_admin(client: TestClient, admin: User, make_user):
    other = make_user(email="outro.admin@empresa.com", role=Role.ADMIN)
    response = client.patch(f"/admin/users/{other.id}", json={"role": "editor"})
    assert response.status_code == 200 and response.json()["role"] == "editor"


def test_servico_nunca_deixa_zero_admins_ativos(db: Session, make_user):
    # Defesa em profundidade além da regra "não altera a si mesmo".
    only_admin = make_user(email="admin@empresa.com", role=Role.ADMIN)
    actor = make_user(email="ator@empresa.com")
    service = UserService(db)
    for changes in ({"role": Role.USER}, {"is_active": False}):
        with pytest.raises(ConflictError):
            service.update_user(actor, only_admin.id, **changes)
        db.rollback()
    db.refresh(only_admin)
    assert only_admin.role == "admin" and only_admin.is_active


@pytest.mark.parametrize(
    ("body", "status"),
    [
        ({}, 400),
        ({"role": "superadmin"}, 400),
        ({"role": "editor", "email": "trocado@empresa.com"}, 400),
        ({"is_active": "talvez"}, 400),
    ],
)
def test_patch_rejeita_corpo_invalido(client: TestClient, admin: User, make_user, body, status):
    target = make_user(email="pessoa@empresa.com")
    assert client.patch(f"/admin/users/{target.id}", json=body).status_code == status


def test_patch_usuario_inexistente_404(client: TestClient, admin: User):
    response = client.patch(f"/admin/users/{uuid.uuid4()}", json={"role": "editor"})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
    assert client.patch("/admin/users/nao-e-uuid", json={"role": "editor"}).status_code == 400


def test_gestao_exige_admin(client: TestClient, make_user, new_client):
    target = make_user(email="pessoa@empresa.com")
    client.cookies.clear()
    assert client.patch(f"/admin/users/{target.id}", json={"role": "editor"}).status_code == 401
    for role in (Role.USER, Role.EDITOR):
        member = make_user(email=f"{role.value}.membro@empresa.com", role=role)
        c = new_client()
        _sign_in(c, member.email)
        assert c.patch(f"/admin/users/{target.id}", json={"role": "admin"}).status_code == 403
        reset = c.post(f"/admin/users/{target.id}/password", json={"password": TEMP_PASSWORD})
        assert reset.status_code == 403


# ── Redefinição de senha pelo admin ──────────────────────────────────────────


def test_admin_redefine_senha_exige_troca_e_derruba_sessoes(
    client: TestClient, admin: User, make_user, new_client, caplog
):
    target = make_user(email="pessoa@empresa.com")
    target_browser = new_client()
    _sign_in(target_browser, target.email)

    with caplog.at_level(logging.INFO):
        response = client.post(
            f"/admin/users/{target.id}/password", json={"password": TEMP_PASSWORD}
        )

    assert response.status_code == 204
    assert TEMP_PASSWORD not in caplog.text
    assert target_browser.get("/auth/me").status_code == 401
    old = target_browser.post("/auth/login", json={"email": target.email, "password": PASSWORD})
    assert old.status_code == 401
    new = target_browser.post(
        "/auth/login", json={"email": target.email, "password": TEMP_PASSWORD}
    )
    assert new.status_code == 200
    assert new.json()["user"]["must_change_password"] is True


def test_redefinicao_nao_vale_para_a_propria_conta(client: TestClient, admin: User):
    response = client.post(f"/admin/users/{admin.id}/password", json={"password": TEMP_PASSWORD})
    assert response.status_code == 403
    assert client.get("/auth/me").status_code == 200


def test_redefinicao_valida_politica_e_existencia(client: TestClient, admin: User, make_user):
    target = make_user(email="pessoa@empresa.com")
    short = client.post(f"/admin/users/{target.id}/password", json={"password": "curta"})
    assert short.status_code == 400 and "curta" not in short.text
    missing = client.post(f"/admin/users/{uuid.uuid4()}/password", json={"password": TEMP_PASSWORD})
    assert missing.status_code == 404


# ── Troca da própria senha ───────────────────────────────────────────────────


def _change(c: TestClient, current: str = PASSWORD, new: str = NEW_PASSWORD):
    return c.post("/auth/password", json={"current_password": current, "new_password": new})


def test_troca_de_senha_mantem_sessao_atual_e_encerra_as_outras(
    client: TestClient, make_user, new_client, db: Session, caplog
):
    user = make_user()
    _sign_in(client, user.email)
    other_device = new_client()
    _sign_in(other_device, user.email)

    with caplog.at_level(logging.INFO):
        response = _change(client)

    assert response.status_code == 204
    assert PASSWORD not in caplog.text and NEW_PASSWORD not in caplog.text
    assert client.get("/auth/me").status_code == 200
    assert other_device.get("/auth/me").status_code == 401
    reasons = set(db.scalars(select(UserSession.revoked_reason)).all())
    assert "password_changed" in reasons

    fresh = new_client()
    old = fresh.post("/auth/login", json={"email": user.email, "password": PASSWORD})
    assert old.status_code == 401
    _sign_in(fresh, user.email, NEW_PASSWORD)


def test_primeiro_acesso_criado_pelo_admin_troca_e_libera(
    client: TestClient, admin: User, new_client
):
    created = client.post(
        "/admin/users",
        json={
            "email": "novo@empresa.com",
            "password": TEMP_PASSWORD,
            "role": "editor",
            "username": "novo",
            "display_name": "Novo",
        },
    )
    assert created.status_code == 201

    newcomer = new_client()
    first = newcomer.post(
        "/auth/login", json={"email": "novo@empresa.com", "password": TEMP_PASSWORD}
    )
    assert first.json()["user"]["must_change_password"] is True

    assert _change(newcomer, TEMP_PASSWORD, NEW_PASSWORD).status_code == 204
    assert newcomer.get("/auth/me").json()["must_change_password"] is False


@pytest.mark.parametrize(
    ("current", "new", "message"),
    [
        ("senha-atual-errada", NEW_PASSWORD, "Senha atual incorreta"),
        (PASSWORD, PASSWORD, "A nova senha deve ser diferente da atual"),
    ],
)
def test_troca_de_senha_recusada(client: TestClient, make_user, login, current, new, message):
    make_user()
    login()
    response = _change(client, current, new)
    assert response.status_code == 400
    assert response.json()["error"] == {"code": "VALIDATION_ERROR", "message": message}
    assert client.get("/auth/me").status_code == 200  # a sessão segue válida


def test_troca_de_senha_valida_politica_e_exige_sessao(client: TestClient, make_user, login):
    make_user()
    login()
    short = _change(client, PASSWORD, "curta")
    assert short.status_code == 400 and "curta" not in short.text
    client.cookies.clear()
    assert _change(client).status_code == 401


def test_troca_de_senha_exige_origem_confiavel(client: TestClient, make_user, login):
    make_user()
    login()
    response = client.post(
        "/auth/password",
        json={"current_password": PASSWORD, "new_password": NEW_PASSWORD},
        headers={"Origin": "https://evil.example"},
    )
    assert response.status_code == 403


def test_troca_de_senha_tem_limite_de_tentativas(client: TestClient, make_user, login):
    make_user()
    login()
    statuses = [_change(client, "senha-atual-errada").status_code for _ in range(6)]
    assert statuses[:5] == [400] * 5
    assert statuses[5] == 429
