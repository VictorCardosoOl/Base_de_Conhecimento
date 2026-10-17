import secrets
from functools import lru_cache

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from backend.core.config import get_settings

PASSWORD_MIN_LENGTH = 12
PASSWORD_MAX_LENGTH = 256


@lru_cache
def get_password_hasher() -> PasswordHasher:
    settings = get_settings()
    return PasswordHasher(
        time_cost=settings.ARGON2_TIME_COST,
        memory_cost=settings.ARGON2_MEMORY_COST_KIB,
        parallelism=settings.ARGON2_PARALLELISM,
    )


@lru_cache
def _dummy_hash() -> str:
    # Hash de um valor aleatório, com os mesmos parâmetros dos hashes reais.
    return get_password_hasher().hash(secrets.token_urlsafe(32))


def hash_password(password: str) -> str:
    return get_password_hasher().hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return get_password_hasher().verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def verify_against_dummy(password: str) -> None:
    """Executa uma verificação completa quando o usuário não existe.

    Assim o tempo de resposta de "email inexistente" fica equivalente ao de
    "senha incorreta", o que impede enumeração de usuários por tempo.
    """
    verify_password(_dummy_hash(), password)


def needs_rehash(password_hash: str) -> bool:
    return get_password_hasher().check_needs_rehash(password_hash)
