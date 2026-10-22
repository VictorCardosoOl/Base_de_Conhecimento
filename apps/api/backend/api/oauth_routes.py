"""Login social (ADR-0013). /start e /callback são navegações do navegador (redirecionam);
as demais rotas são JSON, usadas pela tela de conclusão do cadastro."""

from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, Response, status
from fastapi.responses import RedirectResponse

from backend.api.cookies import clear_oauth_cookie, set_auth_cookies, set_oauth_cookie
from backend.core.config import Settings, get_settings
from backend.core.email import EmailSender, deliver
from backend.dependencies.dependencies import (
    get_client_info,
    get_email_sender,
    get_oauth_service,
)
from backend.schemas.user_schemas import (
    ErrorResponse,
    OAuthProviderOut,
    OAuthProvidersResponse,
    PendingSocialSignupOut,
    SocialSignupRequest,
    SocialSignupResponse,
    UserOut,
)
from backend.services.auth_service import ClientInfo
from backend.services.oauth_service import OAuthFlowError, OAuthService
from backend.services.registration import AcceptedTerms, ProfileData

router = APIRouter(prefix="/auth/oauth", tags=["Login social"])

_JSON_ERRORS: dict[int | str, dict[str, Any]] = {
    400: {"model": ErrorResponse, "description": "Dados inválidos ou cadastro expirado"},
    403: {"model": ErrorResponse, "description": "Origem não permitida"},
}
_REDIRECT_DESCRIPTION = "Redireciona (303); erros voltam a /login?erro=oauth_<motivo>."


def _redirect(settings: Settings, path: str) -> RedirectResponse:
    return RedirectResponse(
        f"{settings.PUBLIC_APP_URL}{path}", status_code=status.HTTP_303_SEE_OTHER
    )


def _error_redirect(settings: Settings, error: OAuthFlowError) -> RedirectResponse:
    response = _redirect(settings, f"/login?erro=oauth_{error.code}")
    clear_oauth_cookie(response, settings.oauth_state_cookie_name, settings)
    return response


@router.get(
    "/providers",
    response_model=OAuthProvidersResponse,
    summary="Provedores sociais configurados",
    description="Só aparecem os provedores com client id e secret definidos.",
)
def list_providers(service: OAuthService = Depends(get_oauth_service)) -> OAuthProvidersResponse:
    return OAuthProvidersResponse(
        providers=[
            OAuthProviderOut(id=provider.id, name=provider.display_name)
            for provider in service.enabled_providers()
        ]
    )


@router.get(
    "/pending",
    response_model=PendingSocialSignupOut,
    summary="Cadastro social aguardando conclusão",
    description=(
        "Lê o cookie do cadastro pendente e devolve o email confirmado pelo provedor e as "
        "sugestões de nome. Sem cadastro pendente (ou vencido): 400 `INVALID_TOKEN`."
    ),
    responses={400: _JSON_ERRORS[400]},
)
def pending_signup(
    request: Request,
    service: OAuthService = Depends(get_oauth_service),
    settings: Settings = Depends(get_settings),
) -> PendingSocialSignupOut:
    view = service.pending_signup(request.cookies.get(settings.oauth_signup_cookie_name))
    return PendingSocialSignupOut(
        provider=view.provider,
        provider_name=view.provider_name,
        email=view.email,
        suggested_display_name=view.suggested_display_name,
        suggested_username=view.suggested_username,
    )


@router.post(
    "/pending/cancel",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desistir do cadastro social pendente",
    description="Apaga o cadastro pendente e o cookie. Idempotente.",
    responses={403: _JSON_ERRORS[403]},
)
def cancel_pending_signup(
    request: Request,
    service: OAuthService = Depends(get_oauth_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    service.cancel_pending(request.cookies.get(settings.oauth_signup_cookie_name))
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_oauth_cookie(response, settings.oauth_signup_cookie_name, settings)
    return response


@router.post(
    "/complete",
    response_model=SocialSignupResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Concluir o cadastro por login social",
    description=(
        "Cria a conta (sempre `user`, email já confirmado pelo provedor), vincula o provedor, "
        "registra o aceite dos termos e abre a sessão (mesmos cookies do login). Exige "
        "usuário, nome e `accept_terms=true` com as versões vigentes."
    ),
    responses={
        **_JSON_ERRORS,
        404: {"model": ErrorResponse, "description": "Cadastro público desligado"},
        409: {"model": ErrorResponse, "description": "Usuário ou email já em uso"},
        429: {"model": ErrorResponse, "description": "Excesso de cadastros"},
    },
)
def complete_signup(
    body: SocialSignupRequest,
    request: Request,
    response: Response,
    client: ClientInfo = Depends(get_client_info),
    service: OAuthService = Depends(get_oauth_service),
    settings: Settings = Depends(get_settings),
) -> SocialSignupResponse:
    tokens, next_path = service.complete_signup(
        request.cookies.get(settings.oauth_signup_cookie_name),
        username=body.username,
        display_name=body.display_name,
        terms=AcceptedTerms(body.terms_version, body.privacy_version),
        profile=ProfileData(body.organization, body.professional_area),
        client=client,
    )
    set_auth_cookies(response, tokens, settings)
    clear_oauth_cookie(response, settings.oauth_signup_cookie_name, settings)
    return SocialSignupResponse(
        user=UserOut.model_validate(tokens.user),
        access_token_expires_at=tokens.access_expires_at,
        next_path=next_path,
    )


@router.get(
    "/{provider}/start",
    status_code=status.HTTP_303_SEE_OTHER,
    response_class=RedirectResponse,
    summary="Iniciar o login social",
    description=(
        "Gera `state` e o par PKCE (S256), guarda o `state` num cookie HttpOnly e redireciona "
        "ao provedor. `next` (caminho interno) é para onde voltar depois. " + _REDIRECT_DESCRIPTION
    ),
)
def start_login(
    provider: str,
    next_path: str | None = Query(default=None, alias="next", max_length=512),
    client: ClientInfo = Depends(get_client_info),
    service: OAuthService = Depends(get_oauth_service),
    settings: Settings = Depends(get_settings),
) -> RedirectResponse:
    try:
        started = service.start(provider, next_path, client)
    except OAuthFlowError as error:
        return _error_redirect(settings, error)
    response = RedirectResponse(started.redirect_url, status_code=status.HTTP_303_SEE_OTHER)
    set_oauth_cookie(
        response,
        settings.oauth_state_cookie_name,
        started.state,
        settings.OAUTH_STATE_TTL_SECONDS,
        settings,
    )
    return response


@router.get(
    "/{provider}/callback",
    status_code=status.HTTP_303_SEE_OTHER,
    response_class=RedirectResponse,
    summary="Retorno do provedor social",
    description=(
        "Confere o `state` (cookie + banco, uso único), troca o código com o `code_verifier` "
        "e: entra na conta vinculada; vincula a uma conta com o mesmo email já confirmado; "
        "ou abre o cadastro pendente (/cadastro/social). " + _REDIRECT_DESCRIPTION
    ),
)
def callback(
    provider: str,
    request: Request,
    background: BackgroundTasks,
    code: str | None = Query(default=None, max_length=2048),
    state: str | None = Query(default=None, max_length=256),
    error: str | None = Query(default=None, max_length=256),
    client: ClientInfo = Depends(get_client_info),
    service: OAuthService = Depends(get_oauth_service),
    settings: Settings = Depends(get_settings),
    email_sender: EmailSender = Depends(get_email_sender),
) -> RedirectResponse:
    try:
        outcome = service.callback(
            provider,
            code=code,
            state=state,
            cookie_state=request.cookies.get(settings.oauth_state_cookie_name),
            provider_error=error,
            client=client,
        )
    except OAuthFlowError as flow_error:
        return _error_redirect(settings, flow_error)

    if outcome.pending_token is not None:
        response = _redirect(settings, "/cadastro/social")
        set_oauth_cookie(
            response,
            settings.oauth_signup_cookie_name,
            outcome.pending_token,
            settings.OAUTH_PENDING_SIGNUP_TTL_SECONDS,
            settings,
        )
    else:
        response = _redirect(settings, outcome.next_path)
        if outcome.tokens is not None:
            set_auth_cookies(response, outcome.tokens, settings)
    if outcome.notice is not None:
        background.add_task(deliver, email_sender, outcome.notice)
    clear_oauth_cookie(response, settings.oauth_state_cookie_name, settings)
    return response
