from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.core.tokens import hash_refresh_token, issue_access_token
from backend.models.refresh_token import RefreshToken
from backend.models.session import UserSession
from backend.models.user import Role, User
from tests.conftest import PASSWORD
from tests.helpers import (
    ACCESS_COOKIE,
    REFRESH_COOKIE,
    access_token_from,
    refresh_token_from,
    set_cookies,
)


def _refresh_with(client: TestClient, refresh_token: str):
    client.cookies.clear()
    client.cookies.set(REFRESH_COOKIE, refresh_token)
    return client.post("/auth/refresh")


# ── Refresh ──────────────────────────────────────────────────────────────────


def test_refresh_rotaciona_e_invalida_o_anterior(client: TestClient, make_user, login, db: Session):
    make_user()
    first = refresh_token_from(login())

    response = _refresh_with(client, first)

    assert response.status_code == 200
    second = refresh_token_from(response)
    assert second != first
    old = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(first))
    )
    new = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(second))
    )
    assert old is not None and new is not None
    assert old.used_at is not None
    assert old.replaced_by_id == new.id
    assert new.session_id == old.session_id


def test_refresh_nunca_grava_o_token_em_claro(client: TestClient, make_user, login, db: Session):
    make_user()
    token = refresh_token_from(login())
    stored = db.scalars(select(RefreshToken.token_hash)).all()
    assert token not in stored
    assert hash_refresh_token(token) in stored


def test_reuso_de_refresh_revoga_a_familia_inteira(
    client: TestClient, make_user, login, db: Session
):
    make_user()
    first = refresh_token_from(login())
    second = refresh_token_from(_refresh_with(client, first))
    # Fora da janela de tolerância (ADR-0008): a rotação aconteceu há 11 s.
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(first))
        .values(used_at=datetime.now(UTC) - timedelta(seconds=11))
    )
    db.commit()

    reuse = _refresh_with(client, first)  # atacante reapresenta o token antigo

    assert reuse.status_code == 401
    session = db.scalar(select(UserSession))
    assert session is not None
    db.refresh(session)
    assert session.revoked_at is not None
    assert session.revoked_reason == "refresh_token_reuse"
    # O token legítimo mais novo também deixa de funcionar.
    assert _refresh_with(client, second).status_code == 401


def test_refresh_expirado(client: TestClient, make_user, login, db: Session):
    make_user()
    token = refresh_token_from(login())
    db.execute(update(RefreshToken).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    db.commit()

    response = _refresh_with(client, token)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "SESSION_EXPIRED"


def test_sessao_com_tempo_maximo_esgotado(client: TestClient, make_user, login, db: Session):
    make_user()
    token = refresh_token_from(login())
    db.execute(update(UserSession).values(expires_at=datetime.now(UTC) - timedelta(seconds=1)))
    db.commit()
    assert _refresh_with(client, token).json()["error"]["code"] == "SESSION_EXPIRED"


def test_refresh_sem_cookie_ou_desconhecido(client: TestClient):
    client.cookies.clear()
    assert client.post("/auth/refresh").status_code == 401
    assert _refresh_with(client, "token-que-nao-existe").status_code == 401


def test_refresh_de_usuario_desativado_revoga_sessao(
    client: TestClient, make_user, login, db: Session
):
    user = make_user()
    token = refresh_token_from(login())
    db.execute(update(User).where(User.id == user.id).values(is_active=False))
    db.commit()

    assert _refresh_with(client, token).status_code == 401
    session = db.scalar(select(UserSession))
    assert session is not None and session.revoked_reason == "user_inactive"


# ── Logout ───────────────────────────────────────────────────────────────────


def test_logout_revoga_sessao_e_limpa_cookies(client: TestClient, make_user, login):
    make_user()
    login_response = login()
    refresh_token = refresh_token_from(login_response)
    access_token = access_token_from(login_response)

    response = client.post("/auth/logout")

    assert response.status_code == 204
    cleared = set_cookies(response)
    assert cleared[ACCESS_COOKIE]["max-age"] == "0"
    assert cleared[REFRESH_COOKIE]["max-age"] == "0"
    # Nem o refresh nem o access token antigos funcionam mais.
    assert _refresh_with(client, refresh_token).status_code == 401
    me = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})
    assert me.status_code == 401


def test_logout_e_idempotente(client: TestClient, make_user, login):
    make_user()
    login()
    assert client.post("/auth/logout").status_code == 204
    assert client.post("/auth/logout").status_code == 204
    client.cookies.clear()
    assert client.post("/auth/logout").status_code == 204


def test_logout_all_revoga_todas_as_sessoes(client: TestClient, make_user, login):
    make_user()
    other_device = refresh_token_from(login())
    login()

    assert client.post("/auth/logout-all").status_code == 204
    assert _refresh_with(client, other_device).status_code == 401


# ── /auth/me ─────────────────────────────────────────────────────────────────


def test_me_por_cookie_e_por_bearer(client: TestClient, make_user, login):
    user = make_user()
    access_token = access_token_from(login())

    by_cookie = client.get("/auth/me")
    client.cookies.clear()
    by_bearer = client.get("/auth/me", headers={"Authorization": f"Bearer {access_token}"})

    expected = {
        "id": str(user.id),
        "email": user.email,
        "username": user.username,
        "display_name": user.display_name,
        "role": "user",
        "must_change_password": False,
        "email_verified": False,
        "has_password": True,
    }
    assert by_cookie.json() == by_bearer.json() == expected
    assert PASSWORD not in by_cookie.text and "hash" not in by_cookie.text


def test_me_sem_token(client: TestClient):
    client.cookies.clear()
    response = client.get("/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_me_com_access_token_expirado(client: TestClient, make_user, login, db: Session):
    user = make_user()
    login()
    session = db.scalar(select(UserSession))
    assert session is not None
    expired, _ = issue_access_token(
        user.id, Role.USER, session.id, now=datetime.now(UTC) - timedelta(hours=1)
    )
    client.cookies.clear()

    response = client.get("/auth/me", headers={"Authorization": f"Bearer {expired}"})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "SESSION_EXPIRED"


def test_me_com_token_adulterado(client: TestClient, make_user, login):
    make_user()
    token = access_token_from(login())
    header, payload, signature = token.split(".")
    tampered = f"{header}.{payload}.{signature[::-1]}"
    client.cookies.clear()
    assert (
        client.get("/auth/me", headers={"Authorization": f"Bearer {tampered}"}).status_code == 401
    )


def test_me_de_usuario_desativado(client: TestClient, make_user, login, db: Session):
    user = make_user()
    login()
    db.execute(update(User).where(User.id == user.id).values(is_active=False))
    db.commit()
    assert client.get("/auth/me").status_code == 401
