import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, Path, Query, Response, status

from backend.dependencies.dependencies import (
    get_active_user,
    get_content_service,
    get_optional_user,
    require_role,
)
from backend.models.content import ARTICLE_ID_MAX_LENGTH, ARTICLE_ID_PATTERN, CorrectionStatus
from backend.models.user import Role, User
from backend.schemas.content_schemas import (
    ArticleSummary,
    CommentListResponse,
    CommentOut,
    CommentRequest,
    CorrectionListResponse,
    CorrectionOut,
    CorrectionRequest,
    EditCommentRequest,
    ModerationCommentListResponse,
    RatingRequest,
    ResolveCorrectionRequest,
)
from backend.schemas.user_schemas import ErrorResponse
from backend.services.content_service import MAX_COMMENTS_PER_ARTICLE_PAGE, ContentService

router = APIRouter(prefix="/content", tags=["Conteúdo"])

ArticlePath = Path(
    min_length=1,
    max_length=ARTICLE_ID_MAX_LENGTH,
    pattern=ARTICLE_ID_PATTERN,
    description="Identificador público do artigo (slug da URL).",
)

_AUTH: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Não autenticado"},
    429: {"model": ErrorResponse, "description": "Muitas tentativas"},
}
_MODERATION: dict[int | str, dict[str, Any]] = {
    401: {"model": ErrorResponse, "description": "Não autenticado"},
    403: {"model": ErrorResponse, "description": "Requer papel editor ou admin"},
}


# ── Resumo e avaliação ───────────────────────────────────────────────────────


@router.get(
    "/articles/{article_id}/summary",
    response_model=ArticleSummary,
    summary="Média de avaliações, total de comentários e a nota de quem pergunta",
)
def article_summary(
    article_id: str = ArticlePath,
    viewer: User | None = Depends(get_optional_user),
    service: ContentService = Depends(get_content_service),
) -> ArticleSummary:
    return service.summary(article_id, viewer)


@router.put(
    "/articles/{article_id}/rating",
    response_model=ArticleSummary,
    summary="Avaliar o artigo (uma nota por pessoa; enviar de novo altera)",
    responses=_AUTH,
)
def rate_article(
    body: RatingRequest,
    article_id: str = ArticlePath,
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> ArticleSummary:
    return service.rate(user, article_id, body.value)


@router.delete(
    "/articles/{article_id}/rating",
    response_model=ArticleSummary,
    summary="Remover a própria avaliação",
    responses=_AUTH,
)
def remove_rating(
    article_id: str = ArticlePath,
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> ArticleSummary:
    return service.remove_rating(user, article_id)


# ── Sugestões de correção ────────────────────────────────────────────────────


@router.post(
    "/articles/{article_id}/corrections",
    response_model=CorrectionOut,
    status_code=status.HTTP_201_CREATED,
    summary="Sugerir uma correção no artigo",
    responses={
        **_AUTH,
        400: {"model": ErrorResponse, "description": "Dados inválidos"},
        409: {"model": ErrorResponse, "description": "Sugestão idêntica já em revisão"},
    },
)
def suggest_correction(
    body: CorrectionRequest,
    article_id: str = ArticlePath,
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> CorrectionOut:
    correction = service.suggest_correction(
        user, article_id, body.kind, body.description, body.excerpt
    )
    return CorrectionOut.model_validate(correction)


@router.get(
    "/corrections/mine",
    response_model=list[CorrectionOut],
    summary="Minhas sugestões de correção (as 20 mais recentes)",
    responses=_AUTH,
)
def my_corrections(
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> list[CorrectionOut]:
    return [CorrectionOut.model_validate(item) for item in service.corrections_by(user)]


@router.get(
    "/corrections",
    response_model=CorrectionListResponse,
    summary="Fila de revisão das sugestões de correção",
    responses=_MODERATION,
)
def list_corrections(
    status_filter: Literal["open", "resolved", "rejected", "all"] = Query(
        default="open", alias="status", description="Situação; `all` lista todas."
    ),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _moderator: User = Depends(require_role(Role.ADMIN, Role.EDITOR)),
    service: ContentService = Depends(get_content_service),
) -> CorrectionListResponse:
    items, total = service.list_corrections(
        None if status_filter == "all" else CorrectionStatus(status_filter), limit, offset
    )
    return CorrectionListResponse(items=items, total=total, limit=limit, offset=offset)


@router.post(
    "/corrections/{correction_id}/review",
    response_model=CorrectionOut,
    summary="Marcar a sugestão como resolvida ou rejeitada",
    responses={
        **_MODERATION,
        404: {"model": ErrorResponse, "description": "Sugestão não encontrada"},
        409: {"model": ErrorResponse, "description": "Sugestão já revisada"},
    },
)
def review_correction(
    correction_id: uuid.UUID,
    body: ResolveCorrectionRequest,
    moderator: User = Depends(require_role(Role.ADMIN, Role.EDITOR)),
    service: ContentService = Depends(get_content_service),
) -> CorrectionOut:
    correction = service.resolve_correction(
        moderator, correction_id, CorrectionStatus(body.status), body.note
    )
    return CorrectionOut.model_validate(correction)


# ── Comentários ──────────────────────────────────────────────────────────────


@router.get(
    "/articles/{article_id}/comments",
    response_model=CommentListResponse,
    summary="Comentários do artigo (mais recentes primeiro, respostas em ordem)",
)
def list_comments(
    article_id: str = ArticlePath,
    limit: int = Query(default=50, ge=1, le=MAX_COMMENTS_PER_ARTICLE_PAGE),
    offset: int = Query(default=0, ge=0),
    viewer: User | None = Depends(get_optional_user),
    service: ContentService = Depends(get_content_service),
) -> CommentListResponse:
    items, total = service.list_comments(article_id, viewer, limit, offset)
    return CommentListResponse(items=items, total=total)


@router.post(
    "/articles/{article_id}/comments",
    response_model=CommentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Comentar no artigo ou responder a um comentário",
    responses={
        **_AUTH,
        400: {"model": ErrorResponse, "description": "Comentário inválido"},
        409: {"model": ErrorResponse, "description": "Comentário repetido"},
    },
)
def add_comment(
    body: CommentRequest,
    article_id: str = ArticlePath,
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> CommentOut:
    return service.add_comment(user, article_id, body.body, body.parent_id)


@router.patch(
    "/comments/{comment_id}",
    response_model=CommentOut,
    summary="Editar o próprio comentário",
    responses={
        **_AUTH,
        403: {"model": ErrorResponse, "description": "Comentário de outra pessoa"},
        404: {"model": ErrorResponse, "description": "Comentário não encontrado"},
    },
)
def edit_comment(
    comment_id: uuid.UUID,
    body: EditCommentRequest,
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> CommentOut:
    return service.edit_comment(user, comment_id, body.body)


@router.delete(
    "/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover comentário (o próprio; editores e admins removem qualquer um)",
    responses={
        **_AUTH,
        403: {"model": ErrorResponse, "description": "Sem permissão"},
        404: {"model": ErrorResponse, "description": "Comentário não encontrado"},
    },
)
def delete_comment(
    comment_id: uuid.UUID,
    user: User = Depends(get_active_user),
    service: ContentService = Depends(get_content_service),
) -> Response:
    service.delete_comment(user, comment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/comments",
    response_model=ModerationCommentListResponse,
    summary="Comentários recentes de todos os artigos (moderação)",
    responses=_MODERATION,
)
def recent_comments(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _moderator: User = Depends(require_role(Role.ADMIN, Role.EDITOR)),
    service: ContentService = Depends(get_content_service),
) -> ModerationCommentListResponse:
    items, total = service.recent_comments(limit, offset)
    return ModerationCommentListResponse(items=items, total=total, limit=limit, offset=offset)
