import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query, Response, status

from backend.dependencies.dependencies import (
    get_role_request_service,
    get_user_service,
    require_role,
)
from backend.models.user import Role, User
from backend.schemas.user_schemas import (
    AdminRoleRequestOut,
    AdminUserOut,
    CreateUserRequest,
    ErrorResponse,
    ResetPasswordRequest,
    RoleRequestListResponse,
    RoleRequestOut,
    UpdateUserRequest,
    UserListResponse,
)
from backend.services.role_request_service import RoleRequestService
from backend.services.user_service import UserService

router = APIRouter(prefix="/admin", tags=["Administração"])

_ERRORS: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Não autenticado"},
    403: {"model": ErrorResponse, "description": "Requer papel admin"},
}


@router.get(
    "/users",
    response_model=UserListResponse,
    summary="Listar usuários",
    responses=_ERRORS,
)
def list_users(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    q: str | None = Query(
        default=None,
        max_length=254,
        description="Busca (sem diferenciar maiúsculas) em usuário, nome e email.",
    ),
    _admin: User = Depends(require_role(Role.ADMIN)),
    user_service: UserService = Depends(get_user_service),
) -> UserListResponse:
    users, total = user_service.list_users(limit=limit, offset=offset, query=q)
    return UserListResponse(
        items=[AdminUserOut.model_validate(user) for user in users],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/users",
    response_model=AdminUserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar usuário (substitui o cadastro público, que não existe mais)",
    responses={
        **_ERRORS,
        400: {"model": ErrorResponse, "description": "Dados inválidos"},
        409: {"model": ErrorResponse, "description": "Email ou usuário já cadastrado"},
    },
)
def create_user(
    body: CreateUserRequest,
    _admin: User = Depends(require_role(Role.ADMIN)),
    user_service: UserService = Depends(get_user_service),
) -> AdminUserOut:
    # Senha definida pelo admin: o usuário troca no primeiro acesso.
    user = user_service.create_user(
        body.email,
        body.password,
        body.role,
        username=body.username,
        display_name=body.display_name,
        must_change_password=True,
    )
    return AdminUserOut.model_validate(user)


@router.patch(
    "/users/{user_id}",
    response_model=AdminUserOut,
    summary="Alterar papel e/ou ativação de um usuário",
    description=(
        "Mudar o papel ou desativar revoga todas as sessões do usuário. Um admin não altera "
        "o próprio papel nem se desativa, e sempre resta ao menos um admin ativo."
    ),
    responses={
        **_ERRORS,
        400: {"model": ErrorResponse, "description": "Dados inválidos"},
        404: {"model": ErrorResponse, "description": "Usuário não encontrado"},
        409: {"model": ErrorResponse, "description": "Removeria o último admin ativo"},
    },
)
def update_user(
    user_id: uuid.UUID,
    body: UpdateUserRequest,
    admin: User = Depends(require_role(Role.ADMIN)),
    user_service: UserService = Depends(get_user_service),
) -> AdminUserOut:
    user = user_service.update_user(admin, user_id, role=body.role, is_active=body.is_active)
    return AdminUserOut.model_validate(user)


@router.post(
    "/users/{user_id}/password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Redefinir a senha de um usuário",
    description=(
        "Define uma senha temporária, exige troca no próximo acesso e revoga todas as "
        "sessões do usuário. Não vale para a própria conta (use POST /auth/password)."
    ),
    responses={
        **_ERRORS,
        400: {"model": ErrorResponse, "description": "Senha fora da política"},
        404: {"model": ErrorResponse, "description": "Usuário não encontrado"},
    },
)
def reset_password(
    user_id: uuid.UUID,
    body: ResetPasswordRequest,
    admin: User = Depends(require_role(Role.ADMIN)),
    user_service: UserService = Depends(get_user_service),
) -> Response:
    user_service.reset_password(admin, user_id, body.password)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# ── Pedidos de acesso de editor: admin ou editor decide (ADR-0010) ───────────

_DECIDERS = require_role(Role.ADMIN, Role.EDITOR)
_DECISION_ERRORS: dict[int | str, dict[str, Any]] = {
    **_ERRORS,
    403: {"model": ErrorResponse, "description": "Requer papel admin ou editor"},
    404: {"model": ErrorResponse, "description": "Pedido não encontrado"},
    409: {"model": ErrorResponse, "description": "Pedido já decidido ou não aplicável"},
}


@router.get(
    "/role-requests",
    response_model=RoleRequestListResponse,
    summary="Listar pedidos pendentes de acesso de editor",
    responses={**_ERRORS, 403: _DECISION_ERRORS[403]},
)
def list_role_requests(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _decider: User = Depends(_DECIDERS),
    service: RoleRequestService = Depends(get_role_request_service),
) -> RoleRequestListResponse:
    pending, total = service.list_pending(limit=limit, offset=offset)
    items = [
        AdminRoleRequestOut(
            id=item.request.id,
            user_id=item.request.user_id,
            email=item.email,
            username=item.username,
            display_name=item.display_name,
            requested_role=Role(item.request.requested_role),
            status=item.request.status,
            created_at=item.request.created_at,
            decided_at=item.request.decided_at,
        )
        for item in pending
    ]
    return RoleRequestListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post(
    "/role-requests/{request_id}/approve",
    response_model=RoleRequestOut,
    summary="Aprovar pedido: o usuário vira editor",
    description="Muda o papel para editor e revoga as sessões do usuário.",
    responses=_DECISION_ERRORS,
)
def approve_role_request(
    request_id: uuid.UUID,
    decider: User = Depends(_DECIDERS),
    service: RoleRequestService = Depends(get_role_request_service),
) -> RoleRequestOut:
    return RoleRequestOut.model_validate(service.approve(decider, request_id))


@router.post(
    "/role-requests/{request_id}/reject",
    response_model=RoleRequestOut,
    summary="Recusar pedido",
    responses=_DECISION_ERRORS,
)
def reject_role_request(
    request_id: uuid.UUID,
    decider: User = Depends(_DECIDERS),
    service: RoleRequestService = Depends(get_role_request_service),
) -> RoleRequestOut:
    return RoleRequestOut.model_validate(service.reject(decider, request_id))
