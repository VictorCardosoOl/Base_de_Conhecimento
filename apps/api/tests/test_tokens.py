import uuid
from datetime import UTC, datetime, timedelta

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from backend.core.tokens import (
    TokenError,
    TokenExpiredError,
    decode_access_token,
    get_key_set,
    issue_access_token,
    jwk_thumbprint,
)
from backend.models.user import Role
from tests.conftest import SIGNING_KEY

USER_ID = uuid.uuid4()
SESSION_ID = uuid.uuid4()


def _claims(**overrides: object) -> dict[str, object]:
    now = datetime.now(UTC)
    claims: dict[str, object] = {
        "sub": str(USER_ID),
        "sid": str(SESSION_ID),
        "iss": "https://auth.test",
        "aud": "knowledge-api",
        "iat": now,
        "exp": now + timedelta(minutes=5),
        "jti": str(uuid.uuid4()),
        "role": "user",
    }
    claims.update(overrides)
    return {key: value for key, value in claims.items() if value is not None}


def _sign(
    claims: dict[str, object], key: Ed25519PrivateKey = SIGNING_KEY, kid: str | None = None
) -> str:
    kid = kid or jwk_thumbprint(key.public_key())
    return jwt.encode(claims, key, algorithm="EdDSA", headers={"kid": kid})


def test_emite_token_com_claims_obrigatorias():
    token, expires_at = issue_access_token(USER_ID, Role.ADMIN, SESSION_ID)
    header = jwt.get_unverified_header(token)
    payload = jwt.decode(token, options={"verify_signature": False})

    assert header["alg"] == "EdDSA"
    assert header["kid"] == get_key_set().signing_kid
    assert payload["sub"] == str(USER_ID)
    assert payload["role"] == "admin"
    assert payload["iss"] == "https://auth.test"
    assert payload["aud"] == "knowledge-api"
    assert {"iat", "exp", "jti", "sid"} <= payload.keys()
    assert "email" not in payload  # nada além do necessário
    assert payload["exp"] - payload["iat"] == 600

    claims = decode_access_token(token)
    assert claims.user_id == USER_ID
    assert claims.role is Role.ADMIN
    assert claims.expires_at == expires_at


def test_assinatura_de_outra_chave_e_rejeitada():
    intruder = Ed25519PrivateKey.generate()
    forged = _sign(_claims(), key=intruder, kid=get_key_set().signing_kid)
    with pytest.raises(TokenError):
        decode_access_token(forged)


def test_kid_desconhecido_e_rejeitado():
    with pytest.raises(TokenError):
        decode_access_token(_sign(_claims(), kid="kid-inexistente"))


def test_algoritmo_none_ou_hs256_e_rejeitado():
    unsigned = jwt.encode(_claims(), key=None, algorithm="none")
    with pytest.raises(TokenError):
        decode_access_token(unsigned)
    hs = jwt.encode(
        _claims(),
        "segredo-compartilhado-com-mais-de-32-bytes",
        algorithm="HS256",
        headers={"kid": get_key_set().signing_kid},
    )
    with pytest.raises(TokenError):
        decode_access_token(hs)


def test_token_expirado():
    past = datetime.now(UTC) - timedelta(hours=1)
    with pytest.raises(TokenExpiredError):
        decode_access_token(_sign(_claims(iat=past, exp=past + timedelta(minutes=5))))


@pytest.mark.parametrize(
    "override",
    [
        {"iss": "https://outro-emissor"},
        {"aud": "outra-api"},
        {"sub": None},
        {"sub": "usuario@empresa.com"},  # email como sub não é aceito
        {"role": "superadmin"},
        {"role": None},
        {"jti": None},
        {"sid": "nao-e-uuid"},
    ],
)
def test_claims_invalidas_sao_rejeitadas(override: dict[str, object]):
    with pytest.raises(TokenError):
        decode_access_token(_sign(_claims(**override)))


def test_jwks_publica_somente_chave_publica():
    jwks = get_key_set().jwks()
    assert len(jwks["keys"]) == 1
    key = jwks["keys"][0]
    assert key == {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": key["x"],
        "kid": get_key_set().signing_kid,
        "use": "sig",
        "alg": "EdDSA",
    }
    assert "d" not in key  # componente privado


def test_rotacao_aceita_tokens_da_chave_anterior(configure):
    previous = SIGNING_KEY
    token_from_previous = _sign(_claims())
    new_key = Ed25519PrivateKey.generate()
    configure(
        JWT_PRIVATE_KEY=new_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ).decode(),
        JWT_ADDITIONAL_PUBLIC_KEYS=previous.public_key()
        .public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
        .decode(),
    )

    key_set = get_key_set()
    assert key_set.signing_kid == jwk_thumbprint(new_key.public_key())
    assert len(key_set.jwks()["keys"]) == 2
    assert decode_access_token(token_from_previous).user_id == USER_ID
    new_token, _ = issue_access_token(USER_ID, Role.USER, SESSION_ID)
    assert jwt.get_unverified_header(new_token)["kid"] == key_set.signing_kid
