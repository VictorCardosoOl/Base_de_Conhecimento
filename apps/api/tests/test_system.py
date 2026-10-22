import json
from pathlib import Path

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from backend.core.config import Settings
from backend.core.database import get_engine
from backend.core.tokens import get_key_set
from backend.models import Base
from backend.models.base import AUTH_SCHEMA
from tests.conftest import BASE_ENV

ROOT = Path(__file__).resolve().parent.parent


def test_health_com_banco_no_ar(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "up"}


def test_jwks_publico_e_cacheavel(client: TestClient):
    response = client.get("/.well-known/jwks.json")
    assert response.status_code == 200
    assert response.json() == get_key_set().jwks()
    assert response.headers["cache-control"] == "public, max-age=300"


def test_migrations_correspondem_aos_modelos():
    with get_engine().connect() as connection:
        context = MigrationContext.configure(
            connection,
            opts={"include_schemas": True, "version_table_schema": AUTH_SCHEMA},
        )
        diff = compare_metadata(context, Base.metadata)
    assert diff == []


def test_contrato_openapi_versionado_esta_atualizado(app: FastAPI):
    committed = json.loads((ROOT / "docs" / "openapi.json").read_text(encoding="utf-8"))
    assert committed == app.openapi(), (
        "docs/openapi.json desatualizado: rode python -m backend.scripts.export_openapi"
    )


def test_openapi_documenta_o_erro_de_validacao_real(app: FastAPI, client: TestClient):
    schema = app.openapi()
    documented = {
        (path, method): set(operation["responses"])
        for path, operations in schema["paths"].items()
        for method, operation in operations.items()
    }
    assert all("422" not in codes for codes in documented.values())
    assert "HTTPValidationError" not in schema["components"]["schemas"]
    assert "400" in documented[("/auth/login", "post")]

    # E o comportamento real bate com o documentado.
    response = client.post("/auth/login", json={"email": "a@b.c"})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def _settings(**overrides: str) -> Settings:
    values = {**BASE_ENV, **overrides}
    return Settings(_env_file=None, **values)  # type: ignore[arg-type]


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"TRUSTED_ORIGINS": "*"}, "'*' não é permitido"),
        ({"CORS_ALLOWED_ORIGINS": "https://a.test,*"}, "'*' não é permitido"),
        ({"COOKIE_SECURE": "false"}, "exige COOKIE_SECURE=true"),
        ({"COOKIE_DOMAIN": "empresa.com"}, "__Host- não podem definir Domain"),
        ({"SESSION_MAX_LIFETIME_SECONDS": "3600"}, "SESSION_MAX_LIFETIME"),
        ({"ENVIRONMENT": "production", "ARGON2_TIME_COST": "1"}, "Argon2id"),
        ({"ENVIRONMENT": "production", "TRUSTED_ORIGINS": ""}, "TRUSTED_ORIGINS"),
        ({"JWT_PRIVATE_KEY_FILE": "keys/x.pem"}, "exatamente um"),
    ],
)
def test_configuracao_insegura_falha_no_boot(overrides: dict[str, str], message: str):
    with pytest.raises(ValidationError, match=message):
        _settings(**overrides)
