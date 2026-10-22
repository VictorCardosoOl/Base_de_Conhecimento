from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, Query, Request, Response, status

from backend.api.cookies import clear_auth_cookies, set_auth_cookies
from backend.core.config import Settings, get_settings
from backend.core.email import EmailSender, deliver
from backend.core.tokens import AccessTokenClaims
from backend.dependencies.dependencies import (
    get_access_claims,
    get_account_service,
    get_active_user,
    get_auth_service,
    get_client_info,
    get_current_user,
    get_email_sender,
    get_optional_access_claims,
    get_role_request_service,
)
from backend.models.user import User
from backend.repositories.user_repository import normalize_username
from backend.schemas.user_schemas import (
    AuthResponse,
    ChangePasswordRequest,
    ErrorResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    PasswordResetConfirmRequest,
    RegisterRequest,
    RoleRequestOut,
    UsernameAvailabilityResponse,
    UserOut,
    VerifyEmailRequest,
)
from backend.services.account_service import AccountService
from backend.services.auth_service import AuthService, ClientInfo, IssuedTokens
from backend.services.registration import AcceptedTerms
from backend.services.role_request_service import RoleRequestService

router = APIRouter(prefix="/auth", tags=["Autenticação"])

_ERRORS: dict[int | str, dict[str, Any]] = {
    400: {"model": ErrorResponse, "description": "Requisição inválida"},
    401: {"model": ErrorResponse, "description": "Não autenticado ou sessão inválida"},
    403: {"model": ErrorResponse, "description": "Origem não permitida"},
}


def _auth_response(tokens: IssuedTokens) -> AuthResponse:
    return AuthResponse(
        user=UserOut.model_validate(tokens.user),
        access_token_expires_at=tokens.access_expires_at,
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Autenticar com email e senha",
    description=(
        "Define os cookies HttpOnly de access e refresh token. Os tokens não são "
        "devolvidos no corpo. Mesma resposta para email inexistente e senha incorreta."
    ),
    responses={**_ERRORS, 429: {"model": ErrorResponse, "description": "Excesso de tentativas"}},
)
def login(
    body: LoginRequest,
    response: Response,
    client: ClientInfo = Depends(get_client_info),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    tokens = auth_service.login(body.email, body.password, client)
    set_auth_cookies(response, tokens, settings)
    return _auth_response(tokens)


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Cadastro público (conta com papel user)",
    description=(
        "Cria a conta sempre com papel `user` (o corpo não aceita papel) e já abre a sessão, "
        "com os mesmos cookies do login. Exige `accept_terms=true` com as versões vigentes "
        "dos Termos e da Política de Privacidade (o aceite fica registrado). Nomes de usuário "
        "reservados são recusados. Envia o link de confirmação do email. Só existe com "
        "PUBLIC_REGISTRATION_ENABLED=true. Limitado por IP (REGISTER_RATE_LIMIT_*)."
    ),
    responses={
        **_ERRORS,
        404: {"model": ErrorResponse, "description": "Cadastro público desligado"},
        409: {
            "model": ErrorResponse,
            "description": "Email ou usuário já cadastrado (`details[0].field` diz qual)",
        },
        429: {"model": ErrorResponse, "description": "Excesso de cadastros"},
    },
)
def register(
    body: RegisterRequest,
    response: Response,
    background: BackgroundTasks,
    client: ClientInfo = Depends(get_client_info),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
    email_sender: EmailSender = Depends(get_email_sender),
) -> AuthResponse:
    tokens, verification = auth_service.register(
        body.email,
        body.password,
        body.username,
        body.display_name,
        client,
        terms=AcceptedTerms(body.terms_version, body.privacy_version),
        organization=body.organization,
        professional_area=body.professional_area,
    )
    if verification is not None:
        background.add_task(deliver, email_sender, verification)
    set_auth_cookies(response, tokens, settings)
    return _auth_response(tokens)


@router.get(
    "/username-available",
    response_model=UsernameAvailabilityResponse,
    summary="Verificar se um nome de usuário está livre",
    description=(
        "Usado pelos formulários de cadastro para avisar em tempo real. É só uma prévia: a "
        "garantia é a restrição de unicidade no banco, conferida de novo ao cadastrar. "
        "Limitado por IP (USERNAME_CHECK_RATE_LIMIT_*)."
    ),
    responses={429: {"model": ErrorResponse, "description": "Excesso de consultas"}},
)
def username_available(
    username: str = Query(min_length=1, max_length=64),
    client: ClientInfo = Depends(get_client_info),
    auth_service: AuthService = Depends(get_auth_service),
) -> UsernameAvailabilityResponse:
    available, reason = auth_service.username_available(username, client)
    return UsernameAvailabilityResponse(
        username=normalize_username(username), available=available, reason=reason
    )


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Rotacionar o refresh token",
    description=(
        "Usa o cookie de refresh, emite um novo par de tokens e invalida o anterior. "
        "Reapresentar o token anterior dentro de REFRESH_REUSE_GRACE_SECONDS (padrão 10 s) "
        "é tratado como concorrência legítima; fora dessa janela, revoga a sessão inteira."
    ),
    responses=_ERRORS,
)
def refresh(
    request: Request,
    response: Response,
    client: ClientInfo = Depends(get_client_info),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    tokens = auth_service.refresh(request.cookies.get(settings.REFRESH_COOKIE_NAME), client)
    set_auth_cookies(response, tokens, settings)
    return _auth_response(tokens)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerrar a sessão atual",
    description="Revoga a sessão e limpa os cookies. Idempotente: sempre responde 204.",
    responses={403: _ERRORS[403]},
)
def logout(
    request: Request,
    claims: AccessTokenClaims | None = Depends(get_optional_access_claims),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    auth_service.logout(request.cookies.get(settings.REFRESH_COOKIE_NAME), claims)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_auth_cookies(response, settings)
    return response


@router.post(
    "/logout-all",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Encerrar todas as sessões do usuário",
    responses=_ERRORS,
)
def logout_all(
    user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
) -> Response:
    auth_service.logout_all(user)
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_auth_cookies(response, settings)
    return response


@router.post(
    "/password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Trocar a própria senha",
    description=(
        "Exige a senha atual. Encerra as demais sessões do usuário; a atual continua válida. "
        "Limpa a exigência de troca de senha definida por um administrador."
    ),
    responses={
        **_ERRORS,
        400: {"model": ErrorResponse, "description": "Senha atual incorreta ou nova inválida"},
        429: {"model": ErrorResponse, "description": "Excesso de tentativas"},
    },
)
def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    claims: AccessTokenClaims = Depends(get_access_claims),
    auth_service: AuthService = Depends(get_auth_service),
) -> Response:
    auth_service.change_password(user, claims.session_id, body.current_password, body.new_password)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


FORGOT_REPLY = (
    "Se houver uma conta com este email, enviaremos um link para criar uma nova senha. "
    "Confira a caixa de entrada e o spam."
)


@router.post(
    "/password/forgot",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Pedir link de redefinição de senha",
    description=(
        "Sempre a mesma resposta (202), exista ou não a conta: não revela quais emails "
        "estão cadastrados. Se a conta existe e está ativa, envia em segundo plano um link de "
        "uso único (PASSWORD_RESET_TOKEN_TTL_SECONDS). Limitado por IP e por email."
    ),
    responses={
        400: _ERRORS[400],
        403: _ERRORS[403],
        429: {"model": ErrorResponse, "description": "Excesso de pedidos"},
    },
)
def forgot_password(
    body: ForgotPasswordRequest,
    background: BackgroundTasks,
    client: ClientInfo = Depends(get_client_info),
    account_service: AccountService = Depends(get_account_service),
    email_sender: EmailSender = Depends(get_email_sender),
) -> MessageResponse:
    message = account_service.request_password_reset(body.email, client.ip_address)
    if message is not None:
        background.add_task(deliver, email_sender, message)
    return MessageResponse(message=FORGOT_REPLY)


@router.post(
    "/password/reset",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Definir nova senha com o link recebido por email",
    description=(
        "Mesma política de senha do cadastro. O link vale uma vez. Encerra todas as sessões "
        "do usuário, confirma o email (o link chegou a ele) e avisa o titular por email. "
        "Link inválido, usado ou vencido: 400 `INVALID_TOKEN`."
    ),
    responses={
        **_ERRORS,
        429: {"model": ErrorResponse, "description": "Excesso de tentativas"},
    },
)
def reset_password_with_token(
    body: PasswordResetConfirmRequest,
    background: BackgroundTasks,
    client: ClientInfo = Depends(get_client_info),
    account_service: AccountService = Depends(get_account_service),
    email_sender: EmailSender = Depends(get_email_sender),
) -> Response:
    notice = account_service.reset_password(body.token, body.new_password, client.ip_address)
    background.add_task(deliver, email_sender, notice)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/email/verify",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Confirmar o email com o link recebido",
    description="Link inválido, usado ou vencido: 400 `INVALID_TOKEN`. Não exige sessão.",
    responses={
        **_ERRORS,
        429: {"model": ErrorResponse, "description": "Excesso de tentativas"},
    },
)
def verify_email(
    body: VerifyEmailRequest,
    client: ClientInfo = Depends(get_client_info),
    account_service: AccountService = Depends(get_account_service),
) -> Response:
    account_service.verify_email(body.token, client.ip_address)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/email/verification",
    response_model=MessageResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Reenviar o link de confirmação do email",
    description="Invalida o link anterior. Sem efeito se o email já está confirmado.",
    responses={
        **_ERRORS,
        429: {"model": ErrorResponse, "description": "Excesso de reenvios"},
    },
)
def resend_email_verification(
    background: BackgroundTasks,
    user: User = Depends(get_current_user),
    account_service: AccountService = Depends(get_account_service),
    email_sender: EmailSender = Depends(get_email_sender),
) -> MessageResponse:
    message = account_service.resend_verification(user)
    if message is None:
        return MessageResponse(message="Seu email já está confirmado.")
    background.add_task(deliver, email_sender, message)
    return MessageResponse(message="Enviamos um novo link de confirmação para o seu email.")


@router.post(
    "/role-request",
    response_model=RoleRequestOut,
    status_code=status.HTTP_201_CREATED,
    summary="Pedir acesso de editor",
    description="Só para contas `user`; um pedido pendente por vez. Um admin ou editor decide.",
    responses={
        **_ERRORS,
        409: {"model": ErrorResponse, "description": "Já existe um pedido pendente"},
    },
)
def create_role_request(
    user: User = Depends(get_active_user),
    service: RoleRequestService = Depends(get_role_request_service),
) -> RoleRequestOut:
    return RoleRequestOut.model_validate(service.request_editor(user))


@router.get(
    "/role-request",
    response_model=RoleRequestOut | None,
    summary="Situação do último pedido de acesso de editor",
    responses={401: _ERRORS[401]},
)
def get_role_request(
    user: User = Depends(get_current_user),
    service: RoleRequestService = Depends(get_role_request_service),
) -> RoleRequestOut | None:
    request = service.latest_for(user)
    return RoleRequestOut.model_validate(request) if request else None


@router.get(
    "/me",
    response_model=UserOut,
    summary="Dados mínimos do usuário autenticado",
    description=(
        "`{id, email, username, display_name, role, must_change_password, email_verified, "
        "has_password}`."
    ),
    responses={401: _ERRORS[401]},
)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(user)
