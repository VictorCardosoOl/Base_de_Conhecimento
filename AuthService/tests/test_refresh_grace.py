"""Janela de tolerância para refresh concorrente (ADR-0008)."""

import threading
from datetime import UTC, datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.core.tokens import hash_refresh_token
from backend.models.refresh_token import RefreshToken
from backend.models.session import UserSession
from tests.conftest import APP_ORIGIN
from tests.helpers import REFRESH_COOKIE, refresh_token_from


def _refresh_with(client: TestClient, refresh_token: str):
    client.cookies.clear()
    client.cookies.set(REFRESH_COOKIE, refresh_token)
    return client.post("/auth/refresh")


def _age_rotation(db: Session, token: str, seconds: int) -> None:
    """Simula que a rotação do token aconteceu `seconds` segundos atrás."""
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == hash_refresh_token(token))
        .values(used_at=datetime.now(UTC) - timedelta(seconds=seconds))
    )
    db.commit()


def _session(db: Session) -> UserSession:
    session = db.scalar(select(UserSession))
    assert session is not None
    db.refresh(session)
    return session


def test_rotacao_normal_permanece_intacta(client: TestClient, make_user, login, db: Session):
    make_user()
    first = refresh_token_from(login())
    second = refresh_token_from(_refresh_with(client, first))
    third = refresh_token_from(_refresh_with(client, second))

    assert len({first, second, third}) == 3
    rows = {row.token_hash: row for row in db.scalars(select(RefreshToken)).all()}
    a, b, c = (rows[hash_refresh_token(t)] for t in (first, second, third))
    assert a.used_at is not None and a.replaced_by_id == b.id
    assert b.used_at is not None and b.replaced_by_id == c.id
    assert c.used_at is None
    assert _session(db).revoked_at is None


def test_duas_abas_fazendo_refresh_ao_mesmo_tempo(app: FastAPI, make_user, login, db: Session):
    make_user()
    shared = refresh_token_from(login())
    barrier = threading.Barrier(2)
    responses: list = []

    def tab() -> None:
        with TestClient(app, base_url="https://testserver", headers={"Origin": APP_ORIGIN}) as c:
            c.cookies.set(REFRESH_COOKIE, shared)
            barrier.wait()
            responses.append(c.post("/auth/refresh"))

    threads = [threading.Thread(target=tab) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()

    assert sorted(r.status_code for r in responses) == [200, 200]
    assert _session(db).revoked_at is None
    new_tokens = [refresh_token_from(r) for r in responses]
    assert new_tokens[0] != new_tokens[1]
    # Cada aba segue funcionando com o token que recebeu.
    with TestClient(app, base_url="https://testserver", headers={"Origin": APP_ORIGIN}) as c:
        for token in new_tokens:
            assert _refresh_with(c, token).status_code == 200


def test_segundo_refresh_dentro_da_janela_recebe_novo_par(
    client: TestClient, make_user, login, db: Session
):
    make_user()
    first = refresh_token_from(login())
    second = refresh_token_from(_refresh_with(client, first))
    _age_rotation(db, first, seconds=9)

    retry = _refresh_with(client, first)

    assert retry.status_code == 200
    third = refresh_token_from(retry)
    assert third not in (first, second)
    assert _session(db).revoked_at is None
    # A janela conta a partir da primeira rotação: used_at e o sucessor original ficam.
    original = db.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == hash_refresh_token(first))
    )
    assert original is not None
    assert original.replaced_by_id is not None
    successor = db.get(RefreshToken, original.replaced_by_id)
    assert successor is not None and successor.token_hash == hash_refresh_token(second)


def test_segundo_refresh_fora_da_janela_e_recusado(
    client: TestClient, make_user, login, db: Session
):
    make_user()
    first = refresh_token_from(login())
    _refresh_with(client, first)
    _age_rotation(db, first, seconds=11)

    response = _refresh_with(client, first)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_reuso_depois_da_janela_revoga_a_familia(client: TestClient, make_user, login, db: Session):
    make_user()
    first = refresh_token_from(login())
    second = refresh_token_from(_refresh_with(client, first))
    _age_rotation(db, first, seconds=11)

    assert _refresh_with(client, first).status_code == 401

    session = _session(db)
    assert session.revoked_at is not None
    assert session.revoked_reason == "refresh_token_reuse"
    assert _refresh_with(client, second).status_code == 401


def test_janela_nao_vale_se_o_cliente_ja_avancou_outra_rotacao(
    client: TestClient, make_user, login, db: Session
):
    make_user()
    first = refresh_token_from(login())
    second = refresh_token_from(_refresh_with(client, first))
    _refresh_with(client, second)  # o sucessor já foi usado

    assert _refresh_with(client, first).status_code == 401
    assert _session(db).revoked_reason == "refresh_token_reuse"


def test_janela_configuravel_e_desligavel(configure, make_user, db: Session):
    configure(REFRESH_REUSE_GRACE_SECONDS="0")
    from backend.main import create_app

    with TestClient(
        create_app(), base_url="https://testserver", headers={"Origin": APP_ORIGIN}
    ) as c:
        make_user()
        first = refresh_token_from(
            c.post(
                "/auth/login",
                json={"email": "usuario@empresa.com", "password": "senha-de-teste-segura"},
            )
        )
        _refresh_with(c, first)
        assert _refresh_with(c, first).status_code == 401
    assert _session(db).revoked_reason == "refresh_token_reuse"
