"""Aceite dos termos (registro com data, versões e IP) e perfil opcional (ADR-0014)."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.models.terms_acceptance import TermsAcceptance
from backend.models.user import Role, User
from tests.conftest import TERMS

NEW = {
    "email": "nova@empresa.com",
    "password": "uma-senha-bem-longa",
    "username": "nova",
    "display_name": "Nova Pessoa",
    **TERMS,
}


@pytest.fixture(autouse=True)
def registration_on(configure) -> None:
    configure(PUBLIC_REGISTRATION_ENABLED="true")


def _users(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


@pytest.mark.parametrize(
    "change",
    [
        {"accept_terms": False},
        {"accept_terms": None},
        {"terms_version": ""},
    ],
)
def test_cadastro_sem_aceite_e_recusado(client: TestClient, db: Session, change: dict):
    response = client.post("/auth/register", json={**NEW, **change})
    assert response.status_code == 400
    assert _users(db) == 0


def test_cadastro_sem_o_campo_de_aceite_e_recusado(client: TestClient, db: Session):
    body = {key: value for key, value in NEW.items() if key != "accept_terms"}
    response = client.post("/auth/register", json=body)
    assert response.status_code == 400
    assert response.json()["error"]["details"][0]["field"] == "accept_terms"
    assert _users(db) == 0


@pytest.mark.parametrize("field", ["terms_version", "privacy_version"])
def test_versao_desatualizada_pede_para_reler(client: TestClient, db: Session, field: str):
    response = client.post("/auth/register", json={**NEW, field: "2020-01-01"})
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["details"][0]["field"] == field
    assert "atualizados" in error["message"]
    assert _users(db) == 0


def test_aceite_fica_registrado_com_data_versoes_e_ip(client: TestClient, db: Session):
    assert client.post("/auth/register", json=NEW).status_code == 201

    acceptance = db.scalars(select(TermsAcceptance)).one()
    user = db.scalars(select(User)).one()
    assert acceptance.user_id == user.id
    assert (acceptance.terms_version, acceptance.privacy_version) == (
        TERMS["terms_version"],
        TERMS["privacy_version"],
    )
    assert acceptance.method == "password"
    assert acceptance.accepted_at is not None
    assert acceptance.ip_address == "testclient"


def test_ip_do_aceite_e_opcional(client: TestClient, db: Session, configure):
    configure(PUBLIC_REGISTRATION_ENABLED="true", CONSENT_RECORD_IP="false")
    assert client.post("/auth/register", json=NEW).status_code == 201
    assert db.scalars(select(TermsAcceptance.ip_address)).one() is None


def test_versoes_vigentes_vem_da_configuracao(client: TestClient, configure):
    configure(PUBLIC_REGISTRATION_ENABLED="true", TERMS_VERSION="2027-01-01")
    assert client.post("/auth/register", json=NEW).status_code == 400
    response = client.post("/auth/register", json={**NEW, "terms_version": "2027-01-01"})
    assert response.status_code == 201


# ── Perfil complementar (opcional) ───────────────────────────────────────────


def test_perfil_opcional_e_gravado(client: TestClient, db: Session):
    body = {**NEW, "organization": "  Clínica Exemplo ", "professional_area": "saude_ocupacional"}
    assert client.post("/auth/register", json=body).status_code == 201
    user = db.scalars(select(User)).one()
    assert (user.organization, user.professional_area) == ("Clínica Exemplo", "saude_ocupacional")


def test_perfil_em_branco_vira_vazio(client: TestClient, db: Session):
    body = {**NEW, "organization": "   ", "professional_area": None}
    assert client.post("/auth/register", json=body).status_code == 201
    user = db.scalars(select(User)).one()
    assert (user.organization, user.professional_area) == (None, None)


@pytest.mark.parametrize(
    ("field", "value"),
    [("organization", "x" * 121), ("professional_area", "astronauta"), ("cpf", "123")],
)
def test_perfil_invalido_ou_campo_desconhecido(
    client: TestClient, db: Session, field: str, value: str
):
    response = client.post("/auth/register", json={**NEW, field: value})
    assert response.status_code == 400
    assert _users(db) == 0


def test_banco_rejeita_area_fora_da_lista(db: Session):
    db.add(
        User(
            email="b@empresa.com",
            username="pessoa",
            display_name="B",
            password_hash="x",
            role=Role.USER.value,
            professional_area="astronauta",
        )
    )
    with pytest.raises(IntegrityError, match="ck_users_professional_area_valid"):
        db.commit()
    db.rollback()
