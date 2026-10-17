import re
import uuid
from datetime import UTC, datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.core.errors import (
    ConflictError,
    FieldValidationError,
    ForbiddenError,
    NotFoundError,
)
from backend.core.logger import get_logger
from backend.core.passwords import PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, hash_password
from backend.core.reserved_usernames import is_reserved_username
from backend.models.user import (
    DISPLAY_NAME_MAX_LENGTH,
    USERNAME_PATTERN,
    ProfessionalArea,
    Role,
    User,
)
from backend.repositories.session_repository import SessionRepository
from backend.repositories.user_repository import UserRepository, normalize_username

EMAIL_TAKEN = "Já existe um usuário com este email"
USERNAME_TAKEN = "Este nome de usuário já está em uso"
USERNAME_RESERVED = "Este nome de usuário é reservado. Escolha outro."

logger = get_logger(__name__)


class UserRevocationReason:
    ROLE_CHANGED = "role_changed"
    DEACTIVATED = "user_deactivated"
    PASSWORD_RESET = "password_reset"  # noqa: S105 (motivo de revogação, não é senha)


class UserService:
    """Gestão de usuários só por fluxo administrativo (API admin ou CLI).

    O cadastro público (AuthService.register) também passa por `create_user`. Alterações
    que mudam o que a sessão pode fazer (papel, desativação, redefinição de senha) revogam
    as sessões do usuário: o access token em circulação carrega o papel antigo.
    """

    def __init__(self, db: Session) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._sessions = SessionRepository(db)

    def create_user(
        self,
        email: str,
        password: str | None,
        role: Role,
        username: str,
        display_name: str,
        must_change_password: bool = False,
        *,
        allow_reserved_username: bool = True,
        email_verified: bool = False,
        organization: str | None = None,
        professional_area: ProfessionalArea | None = None,
    ) -> User:
        """`password=None`: conta de login social, sem senha até a pessoa definir uma.

        `allow_reserved_username=False` nos cadastros feitos pela própria pessoa: nomes como
        `admin` e `suporte` ficam só para administradores e a CLI (ADR-0012).
        """
        if password is not None:
            _check_password_policy(password)
        _check_identity(username, display_name)
        if not allow_reserved_username and is_reserved_username(username):
            raise FieldValidationError("username", USERNAME_RESERVED)
        if self._users.exists_by_email(email):
            raise ConflictError(EMAIL_TAKEN, field="email")
        if self._users.exists_by_username(username):
            raise ConflictError(USERNAME_TAKEN, field="username")

        user = self._users.add(
            email=email,
            password_hash=hash_password(password) if password is not None else None,
            role=role,
            username=username,
            display_name=display_name,
            must_change_password=must_change_password,
            email_verified_at=datetime.now(UTC) if email_verified else None,
            organization=organization,
            professional_area=professional_area.value if professional_area else None,
        )
        try:
            self._db.commit()
        except IntegrityError as exc:  # corrida entre duas criações simultâneas
            self._db.rollback()
            # A restrição de unicidade do banco é a garantia final; o nome dela diz o campo.
            if "username" in str(exc.orig):
                raise ConflictError(USERNAME_TAKEN, field="username") from exc
            raise ConflictError(EMAIL_TAKEN, field="email") from exc
        logger.info("user_created user_id=%s role=%s", user.id, user.role)
        return user

    def list_users(
        self, limit: int, offset: int, query: str | None = None
    ) -> tuple[list[User], int]:
        return self._users.list(limit=limit, offset=offset, query=query)

    def username_available(self, username: str) -> tuple[bool, str | None]:
        """(disponível, motivo): `invalid` (formato), `reserved` ou `taken` (já em uso).

        Prévia para o cadastro feito pela própria pessoa: nomes reservados contam como
        indisponíveis, mesmo que nenhuma conta os use.
        """
        if not is_valid_username(username):
            return False, "invalid"
        if is_reserved_username(username):
            return False, "reserved"
        if self._users.exists_by_username(username):
            return False, "taken"
        return True, None

    def update_user(
        self,
        actor: User,
        user_id: uuid.UUID,
        role: Role | None = None,
        is_active: bool | None = None,
    ) -> User:
        # Admins ativos travados antes do alvo: ordem de bloqueio única, sem deadlock.
        active_admins = self._users.lock_active_admin_ids()
        user = self._users.get_for_update(user_id)
        if user is None:
            raise NotFoundError("Usuário não encontrado")

        role_changes = role is not None and role.value != user.role
        deactivates = is_active is False and user.is_active
        if user.id == actor.id and (role_changes or deactivates):
            raise ForbiddenError(
                "Você não pode alterar o próprio papel nem desativar a própria conta"
            )

        loses_admin = user.id in active_admins and (role_changes or deactivates)
        if loses_admin and len(active_admins) <= 1:
            raise ConflictError("É preciso manter ao menos um administrador ativo")

        now = datetime.now(UTC)
        changes: list[str] = []
        if role_changes and role is not None:
            changes.append(f"role:{user.role}->{role.value}")
            user.role = role.value
            self._sessions.revoke_all_for_user(user.id, UserRevocationReason.ROLE_CHANGED, now)
        if is_active is not None and is_active != user.is_active:
            changes.append(f"is_active:{user.is_active}->{is_active}")
            user.is_active = is_active
            if not is_active:
                self._sessions.revoke_all_for_user(user.id, UserRevocationReason.DEACTIVATED, now)

        self._db.commit()
        if changes:
            logger.info(
                "user_updated actor_id=%s user_id=%s changes=%s",
                actor.id,
                user.id,
                ",".join(changes),
            )
        return user

    def reset_password(self, actor: User, user_id: uuid.UUID, password: str) -> None:
        _check_password_policy(password)
        user = self._users.get_for_update(user_id)
        if user is None:
            raise NotFoundError("Usuário não encontrado")
        if user.id == actor.id:
            raise ForbiddenError("Para a sua própria senha, use a troca de senha da sua conta")

        now = datetime.now(UTC)
        user.password_hash = hash_password(password)
        user.password_changed_at = now
        user.must_change_password = True
        revoked = self._sessions.revoke_all_for_user(
            user.id, UserRevocationReason.PASSWORD_RESET, now
        )
        self._db.commit()
        logger.info(
            "user_password_reset actor_id=%s user_id=%s sessions_revoked=%s",
            actor.id,
            user.id,
            revoked,
        )


def is_valid_username(username: str) -> bool:
    return re.fullmatch(USERNAME_PATTERN, normalize_username(username)) is not None


def _check_identity(username: str, display_name: str) -> None:
    """Mesmas regras do schema da API, para quem chama o serviço direto (CLI, seed)."""
    if not is_valid_username(username):
        raise ValueError(
            "usuário inválido: 3 a 30 caracteres (a-z, 0-9, ponto, hífen e sublinhado), "
            "começando com letra ou número"
        )
    if not 1 <= len(display_name.strip()) <= DISPLAY_NAME_MAX_LENGTH:
        raise ValueError(f"o nome deve ter entre 1 e {DISPLAY_NAME_MAX_LENGTH} caracteres")


def _check_password_policy(password: str) -> None:
    if not PASSWORD_MIN_LENGTH <= len(password) <= PASSWORD_MAX_LENGTH:
        raise ValueError(
            f"a senha deve ter entre {PASSWORD_MIN_LENGTH} e {PASSWORD_MAX_LENGTH} caracteres"
        )
