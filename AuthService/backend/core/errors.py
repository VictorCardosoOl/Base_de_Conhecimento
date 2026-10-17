from enum import StrEnum


class ErrorCode(StrEnum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    INVALID_TOKEN = "INVALID_TOKEN"  # noqa: S105 (código de erro, não é segredo)
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    UNAUTHORIZED = "UNAUTHORIZED"
    SESSION_EXPIRED = "SESSION_EXPIRED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED"
    CONFLICT = "CONFLICT"
    RATE_LIMITED = "RATE_LIMITED"
    PASSWORD_CHANGE_REQUIRED = "PASSWORD_CHANGE_REQUIRED"  # noqa: S105 (código de erro)
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class AppError(Exception):
    """Erro de domínio com status HTTP e mensagem segura para o cliente."""

    def __init__(
        self,
        status_code: int,
        code: ErrorCode,
        message: str,
        headers: dict[str, str] | None = None,
        details: list[dict[str, str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.headers = headers
        self.details = details


class InvalidCredentialsError(AppError):
    def __init__(self) -> None:
        # Mesma mensagem para email inexistente, senha errada e usuário desativado.
        super().__init__(401, ErrorCode.INVALID_CREDENTIALS, "Email ou senha inválidos")


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Autenticação necessária") -> None:
        super().__init__(401, ErrorCode.UNAUTHORIZED, message)


class SessionExpiredError(AppError):
    def __init__(self) -> None:
        super().__init__(401, ErrorCode.SESSION_EXPIRED, "Sessão expirada")


class ForbiddenError(AppError):
    def __init__(self, message: str = "Operação não permitida") -> None:
        super().__init__(403, ErrorCode.FORBIDDEN, message)


class PasswordChangeRequiredError(AppError):
    """Senha definida por um administrador: só a troca (e a leitura) é permitida até lá."""

    def __init__(self) -> None:
        super().__init__(
            403,
            ErrorCode.PASSWORD_CHANGE_REQUIRED,
            "Troque a senha temporária antes de continuar",
        )


class NotFoundError(AppError):
    def __init__(self, message: str = "Recurso não encontrado") -> None:
        super().__init__(404, ErrorCode.NOT_FOUND, message)


class ValidationFailedError(AppError):
    """Regra de negócio violada por dados sintaticamente válidos."""

    def __init__(self, message: str) -> None:
        super().__init__(400, ErrorCode.VALIDATION_ERROR, message)


class FieldValidationError(AppError):
    """Regra de negócio violada num campo específico (`details[0].field`)."""

    def __init__(self, field: str, message: str) -> None:
        super().__init__(
            400,
            ErrorCode.VALIDATION_ERROR,
            message,
            details=[{"field": field, "message": message}],
        )


class InvalidTokenError(AppError):
    """Link de email (redefinição, confirmação) ou cadastro social inválido, usado ou vencido."""

    def __init__(self, message: str = "Link inválido ou expirado") -> None:
        super().__init__(400, ErrorCode.INVALID_TOKEN, message)


class ConflictError(AppError):
    def __init__(self, message: str, field: str | None = None) -> None:
        # `field` diz ao cliente qual campo conflitou (ex.: email ou username).
        details = [{"field": field, "message": message}] if field else None
        super().__init__(409, ErrorCode.CONFLICT, message, details=details)


class RateLimitedError(AppError):
    def __init__(self, retry_after_seconds: int) -> None:
        super().__init__(
            429,
            ErrorCode.RATE_LIMITED,
            "Muitas tentativas. Tente novamente mais tarde.",
            headers={"Retry-After": str(retry_after_seconds)},
        )
