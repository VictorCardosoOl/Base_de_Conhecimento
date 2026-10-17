"""Emissão e validação de tokens.

- Access token: JWT EdDSA (Ed25519), curto, validável só com a chave pública (JWKS).
- Refresh token: valor aleatório opaco; o banco guarda apenas o SHA-256.
"""

import base64
import hashlib
import json
import re
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from functools import lru_cache
from typing import Any

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey

from backend.core.config import Settings, get_settings
from backend.models.user import Role

JWT_ALGORITHM = "EdDSA"
_PEM_BLOCK = re.compile(r"-----BEGIN PUBLIC KEY-----.+?-----END PUBLIC KEY-----", re.DOTALL)


class TokenError(Exception):
    """Token ausente, malformado, com assinatura inválida ou claims inválidas."""


class TokenExpiredError(TokenError):
    """Token bem formado e autêntico, mas expirado."""


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _raw_public_bytes(key: Ed25519PublicKey) -> bytes:
    return key.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)


def jwk_thumbprint(key: Ed25519PublicKey) -> str:
    """`kid` determinístico: thumbprint RFC 7638 da chave pública."""
    members = {"crv": "Ed25519", "kty": "OKP", "x": _b64url(_raw_public_bytes(key))}
    canonical = json.dumps(members, separators=(",", ":"), sort_keys=True).encode()
    return _b64url(hashlib.sha256(canonical).digest())


@dataclass(frozen=True)
class KeySet:
    signing_key: Ed25519PrivateKey
    signing_kid: str
    verification_keys: dict[str, Ed25519PublicKey]

    def jwks(self) -> dict[str, list[dict[str, str]]]:
        return {
            "keys": [
                {
                    "kty": "OKP",
                    "crv": "Ed25519",
                    "x": _b64url(_raw_public_bytes(key)),
                    "kid": kid,
                    "use": "sig",
                    "alg": JWT_ALGORITHM,
                }
                for kid, key in self.verification_keys.items()
            ]
        }


def load_key_set(settings: Settings) -> KeySet:
    private_key = serialization.load_pem_private_key(settings.private_key_pem(), password=None)
    if not isinstance(private_key, Ed25519PrivateKey):
        raise ValueError("JWT_PRIVATE_KEY deve ser uma chave Ed25519")

    signing_kid = jwk_thumbprint(private_key.public_key())
    verification_keys: dict[str, Ed25519PublicKey] = {signing_kid: private_key.public_key()}
    for block in _PEM_BLOCK.findall(settings.additional_public_keys_pem()):
        public_key = serialization.load_pem_public_key(block.encode())
        if not isinstance(public_key, Ed25519PublicKey):
            raise ValueError("JWT_ADDITIONAL_PUBLIC_KEYS deve conter apenas chaves Ed25519")
        verification_keys[jwk_thumbprint(public_key)] = public_key
    return KeySet(private_key, signing_kid, verification_keys)


@lru_cache
def get_key_set() -> KeySet:
    return load_key_set(get_settings())


@dataclass(frozen=True)
class AccessTokenClaims:
    user_id: uuid.UUID
    session_id: uuid.UUID
    role: Role
    token_id: str
    expires_at: datetime


def issue_access_token(
    user_id: uuid.UUID, role: Role, session_id: uuid.UUID, now: datetime | None = None
) -> tuple[str, datetime]:
    settings = get_settings()
    key_set = get_key_set()
    issued_at = (now or datetime.now(UTC)).replace(microsecond=0)
    expires_at = issued_at + timedelta(seconds=settings.ACCESS_TOKEN_TTL_SECONDS)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "iss": settings.JWT_ISSUER,
        "aud": settings.JWT_AUDIENCE,
        "iat": issued_at,
        "exp": expires_at,
        "jti": str(uuid.uuid4()),
        "role": role.value,
        # Identificador da sessão: permite ao AuthService recusar tokens de sessões revogadas.
        "sid": str(session_id),
    }
    token = jwt.encode(
        payload, key_set.signing_key, algorithm=JWT_ALGORITHM, headers={"kid": key_set.signing_kid}
    )
    return token, expires_at


def decode_access_token(token: str) -> AccessTokenClaims:
    settings = get_settings()
    key_set = get_key_set()
    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as exc:
        raise TokenError("token malformado") from exc

    kid = header.get("kid")
    key = key_set.verification_keys.get(kid) if isinstance(kid, str) else None
    if key is None:
        raise TokenError("chave de assinatura desconhecida")

    try:
        payload = jwt.decode(
            token,
            key,
            algorithms=[JWT_ALGORITHM],
            audience=settings.JWT_AUDIENCE,
            issuer=settings.JWT_ISSUER,
            options={"require": ["exp", "iat", "iss", "aud", "sub", "jti", "role", "sid"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise TokenExpiredError("token expirado") from exc
    except jwt.InvalidTokenError as exc:
        raise TokenError("token inválido") from exc

    try:
        return AccessTokenClaims(
            user_id=uuid.UUID(payload["sub"]),
            session_id=uuid.UUID(payload["sid"]),
            role=Role(payload["role"]),
            token_id=str(payload["jti"]),
            expires_at=datetime.fromtimestamp(payload["exp"], UTC),
        )
    except (ValueError, TypeError) as exc:
        raise TokenError("claims inválidas") from exc


def generate_refresh_token() -> str:
    """256 bits aleatórios, codificados em base64url."""
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    # Tokens têm 256 bits de entropia: SHA-256 sem sal é suficiente (não há dicionário).
    return hashlib.sha256(token.encode()).hexdigest()
