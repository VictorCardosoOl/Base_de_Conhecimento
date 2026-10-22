import uuid
from datetime import datetime

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from backend.models.user import Role, User


def normalize_email(email: str) -> str:
    """Forma canônica usada em toda gravação e busca (trim + minúsculas)."""
    return email.strip().lower()


def normalize_username(username: str) -> str:
    """Forma canônica do usuário (trim + minúsculas): `Maria.Silva` e `maria.silva` são o mesmo."""
    return username.strip().lower()


def _like_pattern(term: str) -> str:
    """Busca "contém", com os curingas do LIKE (%, _ e a barra invertida) tratados como texto."""
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_email(self, email: str) -> User | None:
        return self._db.scalar(select(User).where(User.email == normalize_email(email)))

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self._db.get(User, user_id)

    def get_for_update(self, user_id: uuid.UUID) -> User | None:
        return self._db.scalar(select(User).where(User.id == user_id).with_for_update())

    def lock_active_admin_ids(self) -> list[uuid.UUID]:
        """Bloqueia os admins ativos até o fim da transação.

        Duas alterações simultâneas (ex.: dois admins rebaixando um ao outro) ficam em fila,
        e a segunda enxerga o resultado da primeira: nunca se chega a zero admins.
        """
        return list(
            self._db.scalars(
                select(User.id)
                .where(User.role == Role.ADMIN.value, User.is_active.is_(True))
                .order_by(User.id)
                .with_for_update()
            ).all()
        )

    def exists_by_email(self, email: str) -> bool:
        return self.get_by_email(email) is not None

    def exists_by_username(self, username: str) -> bool:
        found = self._db.scalar(
            select(User.id).where(User.username == normalize_username(username))
        )
        return found is not None

    def add(
        self,
        email: str,
        password_hash: str | None,
        role: Role,
        username: str,
        display_name: str,
        must_change_password: bool = False,
        email_verified_at: datetime | None = None,
        organization: str | None = None,
        professional_area: str | None = None,
    ) -> User:
        user = User(
            email=normalize_email(email),
            username=normalize_username(username),
            display_name=display_name.strip(),
            password_hash=password_hash,
            role=role.value,
            must_change_password=must_change_password,
            email_verified_at=email_verified_at,
            organization=organization.strip() if organization and organization.strip() else None,
            professional_area=professional_area,
        )
        self._db.add(user)
        self._db.flush()
        return user

    def list(self, limit: int, offset: int, query: str | None = None) -> tuple[list[User], int]:
        conditions = []
        term = (query or "").strip()
        if term:
            pattern = _like_pattern(term)
            conditions.append(
                or_(
                    User.username.ilike(pattern, escape="\\"),
                    User.display_name.ilike(pattern, escape="\\"),
                    User.email.ilike(pattern, escape="\\"),
                )
            )
        total = self._db.scalar(select(func.count()).select_from(User).where(*conditions)) or 0
        users = self._db.scalars(
            # Mais recentes primeiro: quem acabou de ser criado aparece na primeira página.
            select(User)
            .where(*conditions)
            .order_by(User.created_at.desc(), User.id.desc())
            .limit(limit)
            .offset(offset)
        ).all()
        return list(users), total
