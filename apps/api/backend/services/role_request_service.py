import uuid
from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.core.errors import ConflictError, NotFoundError, ValidationFailedError
from backend.core.logger import get_logger
from backend.models.role_request import RoleRequest, RoleRequestStatus
from backend.models.user import Role, User
from backend.repositories.session_repository import SessionRepository
from backend.repositories.user_repository import UserRepository
from backend.services.user_service import UserRevocationReason

logger = get_logger(__name__)


@dataclass(frozen=True)
class PendingRequest:
    request: RoleRequest
    email: str
    username: str
    display_name: str


class RoleRequestService:
    """Pedidos de usuários comuns para virar editor (ADR-0010).

    O próprio usuário só pede; quem decide é um admin ou um editor. Aprovar muda o papel
    no banco e revoga as sessões do usuário (o access token carrega o papel antigo).
    """

    def __init__(self, db: Session) -> None:
        self._db = db
        self._users = UserRepository(db)
        self._sessions = SessionRepository(db)

    def request_editor(self, user: User) -> RoleRequest:
        if user.role != Role.USER.value:
            raise ValidationFailedError("Sua conta já tem acesso de editor ou superior")
        if self._pending_for(user.id) is not None:
            raise ConflictError("Você já tem um pedido pendente")

        request = RoleRequest(user_id=user.id, requested_role=Role.EDITOR.value)
        self._db.add(request)
        try:
            self._db.commit()
        except IntegrityError as exc:  # dois pedidos simultâneos: o índice único barra
            self._db.rollback()
            raise ConflictError("Você já tem um pedido pendente") from exc
        logger.info("role_request_created request_id=%s user_id=%s", request.id, user.id)
        return request

    def latest_for(self, user: User) -> RoleRequest | None:
        return self._db.scalar(
            select(RoleRequest)
            .where(RoleRequest.user_id == user.id)
            .order_by(RoleRequest.created_at.desc())
            .limit(1)
        )

    def list_pending(self, limit: int, offset: int) -> tuple[list[PendingRequest], int]:
        pending = RoleRequest.status == RoleRequestStatus.PENDING.value
        total = self._db.scalar(select(func.count()).select_from(RoleRequest).where(pending)) or 0
        rows = self._db.execute(
            select(RoleRequest, User.email, User.username, User.display_name)
            .join(User, User.id == RoleRequest.user_id)
            .where(pending)
            .order_by(RoleRequest.created_at, RoleRequest.id)
            .limit(limit)
            .offset(offset)
        ).all()
        return [
            PendingRequest(request=row[0], email=row[1], username=row[2], display_name=row[3])
            for row in rows
        ], total

    def approve(self, actor: User, request_id: uuid.UUID) -> RoleRequest:
        request = self._pending_for_decision(request_id)
        user = self._users.get_for_update(request.user_id)
        # O pedido só vale para um usuário comum ativo; se algo mudou, não promove.
        if user is None or not user.is_active or user.role != Role.USER.value:
            raise ConflictError("O pedido não se aplica mais a esta conta")

        now = datetime.now(UTC)
        user.role = Role.EDITOR.value
        self._sessions.revoke_all_for_user(user.id, UserRevocationReason.ROLE_CHANGED, now)
        self._decide(request, actor, RoleRequestStatus.APPROVED, now)
        self._db.commit()
        logger.info(
            "role_request_approved request_id=%s user_id=%s actor_id=%s",
            request.id,
            user.id,
            actor.id,
        )
        return request

    def reject(self, actor: User, request_id: uuid.UUID) -> RoleRequest:
        request = self._pending_for_decision(request_id)
        self._decide(request, actor, RoleRequestStatus.REJECTED, datetime.now(UTC))
        self._db.commit()
        logger.info(
            "role_request_rejected request_id=%s user_id=%s actor_id=%s",
            request.id,
            request.user_id,
            actor.id,
        )
        return request

    def _pending_for(self, user_id: uuid.UUID) -> RoleRequest | None:
        return self._db.scalar(
            select(RoleRequest).where(
                RoleRequest.user_id == user_id,
                RoleRequest.status == RoleRequestStatus.PENDING.value,
            )
        )

    def _pending_for_decision(self, request_id: uuid.UUID) -> RoleRequest:
        # FOR UPDATE: duas decisões simultâneas sobre o mesmo pedido ficam em fila.
        request = self._db.scalar(
            select(RoleRequest).where(RoleRequest.id == request_id).with_for_update()
        )
        if request is None:
            raise NotFoundError("Pedido não encontrado")
        if request.status != RoleRequestStatus.PENDING.value:
            raise ConflictError("Este pedido já foi decidido")
        return request

    @staticmethod
    def _decide(
        request: RoleRequest, actor: User, status: RoleRequestStatus, now: datetime
    ) -> None:
        request.status = status.value
        request.decided_at = now
        request.decided_by = actor.id
