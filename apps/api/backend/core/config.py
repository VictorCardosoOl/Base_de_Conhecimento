import os
from enum import StrEnum
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal, Self
from urllib.parse import urlsplit

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Environment(StrEnum):
    DEVELOPMENT = "development"
    TEST = "test"
    PRODUCTION = "production"


def _is_origin(value: str) -> bool:
    parts = urlsplit(value)
    return (
        parts.scheme in {"http", "https"}
        and bool(parts.netloc)
        and parts.path in {"", "/"}
        and not parts.query
        and not parts.fragment
    )


def _split_csv(value: object) -> object:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    return value


class Settings(BaseSettings):
    """Configuração do serviço. Tudo vem do ambiente; nada sensível tem valor padrão."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DATABASE_URL: SecretStr

    # JWT (EdDSA/Ed25519). Chave privada em PEM (PKCS#8), por valor ou arquivo.
    JWT_PRIVATE_KEY: SecretStr | None = None
    JWT_PRIVATE_KEY_FILE: Path | None = None
    # Chaves públicas antigas mantidas no JWKS durante a janela de rotação (PEMs concatenados).
    JWT_ADDITIONAL_PUBLIC_KEYS: str = ""
    JWT_ADDITIONAL_PUBLIC_KEYS_FILE: Path | None = None
    JWT_ISSUER: str = Field(min_length=1)
    JWT_AUDIENCE: str = Field(min_length=1)

    ACCESS_TOKEN_TTL_SECONDS: int = Field(default=600, ge=60, le=3600)
    REFRESH_TOKEN_TTL_SECONDS: int = Field(default=7 * 24 * 3600, ge=3600)
    SESSION_MAX_LIFETIME_SECONDS: int = Field(default=30 * 24 * 3600, ge=3600)
    # Janela em que reapresentar o refresh token anterior é tratado como concorrência
    # legítima (várias abas), e não como reuso. 0 desliga a tolerância (ADR-0008).
    REFRESH_REUSE_GRACE_SECONDS: int = Field(default=10, ge=0, le=60)

    # Cookies. `__Host-` exige Secure, Path=/ e nenhum Domain; `__Secure-` exige Secure.
    COOKIE_SECURE: bool = True
    COOKIE_SAMESITE: Literal["lax", "strict"] = "lax"
    COOKIE_DOMAIN: str | None = None
    ACCESS_COOKIE_NAME: str = "__Host-kb_at"
    REFRESH_COOKIE_NAME: str = "__Secure-kb_rt"
    REFRESH_COOKIE_PATH: str = "/auth"

    # Origens aceitas em requisições que alteram estado (defesa CSRF por Origin).
    TRUSTED_ORIGINS: Annotated[list[str], NoDecode] = []
    # CORS fica desligado por padrão: com o BFF/rewrite do Next tudo é mesma origem.
    CORS_ALLOWED_ORIGINS: Annotated[list[str], NoDecode] = []

    LOGIN_RATE_LIMIT_ATTEMPTS: int = Field(default=5, ge=1)
    LOGIN_RATE_LIMIT_IP_ATTEMPTS: int = Field(default=30, ge=1)
    LOGIN_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, ge=1)
    # Por conta (email), independente do IP: o IP pode ser o do proxy ou forjado no
    # X-Forwarded-For. Janela maior: protege a conta de tentativas lentas e distribuídas.
    LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS: int = Field(default=10, ge=1)
    LOGIN_RATE_LIMIT_ACCOUNT_WINDOW_SECONDS: int = Field(default=900, ge=1)
    # Quantidade de proxies confiáveis à frente do serviço (para ler X-Forwarded-For).
    TRUSTED_PROXY_COUNT: int = Field(default=0, ge=0)

    # Cadastro público (POST /auth/register): cria contas sempre com papel `user` (ADR-0010).
    # Desligado por padrão; cada ambiente decide explicitamente.
    PUBLIC_REGISTRATION_ENABLED: bool = False
    REGISTER_RATE_LIMIT_IP_ATTEMPTS: int = Field(default=10, ge=1)
    REGISTER_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=3600, ge=1)
    # Consulta de disponibilidade do nome de usuário (GET /auth/username-available), por IP.
    USERNAME_CHECK_RATE_LIMIT_ATTEMPTS: int = Field(default=60, ge=1)
    USERNAME_CHECK_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=60, ge=1)

    # Usuários de teste (admin, editor, user) criados pela CLI `seed-dev-users`.
    # Nunca em produção: a configuração é rejeitada.
    SEED_DEV_USERS: bool = False

    # Argon2id. Padrões = perfil recomendado da RFC 9106 (t=3, m=64 MiB, p=4).
    ARGON2_TIME_COST: int = Field(default=3, ge=1)
    ARGON2_MEMORY_COST_KIB: int = Field(default=65536, ge=64)
    ARGON2_PARALLELISM: int = Field(default=4, ge=1)

    # Endereço público do site (origem do Next, que repassa /auth/*): base dos links
    # enviados por email e das URLs de retorno (callback) do login social.
    PUBLIC_APP_URL: str = "http://localhost:3000"

    # Recuperação de senha e confirmação de email (ADR-0012). Tokens de uso único.
    PASSWORD_RESET_TOKEN_TTL_SECONDS: int = Field(default=1800, ge=300, le=86400)
    EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: int = Field(default=86400, ge=3600, le=7 * 86400)
    # Pedidos de "esqueci a senha": por IP e por email (o mesmo limite para email inexistente).
    PASSWORD_RESET_RATE_LIMIT_IP_ATTEMPTS: int = Field(default=10, ge=1)
    PASSWORD_RESET_RATE_LIMIT_EMAIL_ATTEMPTS: int = Field(default=3, ge=1)
    PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=900, ge=1)
    # Uso de links (redefinir senha, confirmar email) por IP e reenvio da confirmação.
    TOKEN_CONFIRM_RATE_LIMIT_IP_ATTEMPTS: int = Field(default=20, ge=1)
    TOKEN_CONFIRM_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=900, ge=1)
    EMAIL_VERIFICATION_RESEND_ATTEMPTS: int = Field(default=3, ge=1)
    EMAIL_VERIFICATION_RESEND_WINDOW_SECONDS: int = Field(default=900, ge=1)

    # Envio de email: smtp (produção e Mailpit local), memory (só testes) ou disabled.
    EMAIL_BACKEND: Literal["smtp", "memory", "disabled"] = "disabled"
    EMAIL_FROM: str = "Base de Conhecimento <nao-responda@localhost>"
    SMTP_HOST: str | None = None
    SMTP_PORT: int = Field(default=587, ge=1, le=65535)
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: SecretStr | None = None
    # starttls (587) ou ssl (465). `none` só fora de produção (ex.: Mailpit local).
    SMTP_SECURITY: Literal["starttls", "ssl", "none"] = "starttls"
    SMTP_TIMEOUT_SECONDS: int = Field(default=10, ge=1, le=60)

    # Termos de Uso e Política de Privacidade (ADR-0014): versões vigentes, que o cadastro
    # precisa aceitar. Devem ser iguais às exibidas pela Base de Conhecimento.
    TERMS_VERSION: str = Field(default="2026-10-10", min_length=1, max_length=20)
    PRIVACY_POLICY_VERSION: str = Field(default="2026-10-10", min_length=1, max_length=20)
    # Guarda o IP junto do aceite (prova do consentimento). false = não guarda.
    CONSENT_RECORD_IP: bool = True

    # Login social (OAuth 2.0 + PKCE, ADR-0013). Provedor sem client id e secret fica
    # desligado. URL de retorno: {PUBLIC_APP_URL}/auth/oauth/<provedor>/callback.
    OAUTH_GOOGLE_CLIENT_ID: str | None = None
    OAUTH_GOOGLE_CLIENT_SECRET: SecretStr | None = None
    OAUTH_GITHUB_CLIENT_ID: str | None = None
    OAUTH_GITHUB_CLIENT_SECRET: SecretStr | None = None
    OAUTH_STATE_TTL_SECONDS: int = Field(default=600, ge=60, le=3600)
    OAUTH_PENDING_SIGNUP_TTL_SECONDS: int = Field(default=900, ge=60, le=3600)
    OAUTH_RATE_LIMIT_IP_ATTEMPTS: int = Field(default=30, ge=1)
    OAUTH_RATE_LIMIT_WINDOW_SECONDS: int = Field(default=600, ge=1)

    # Sem valor: ligado em desenvolvimento, desligado em produção. Valor explícito prevalece
    # (em produção, ligado gera aviso no boot).
    OPENAPI_ENABLED: bool | None = None
    LOG_LEVEL: str = "INFO"

    @field_validator("TRUSTED_ORIGINS", "CORS_ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, value: object) -> object:
        return _split_csv(value)

    @field_validator("TRUSTED_ORIGINS", "CORS_ALLOWED_ORIGINS")
    @classmethod
    def _reject_wildcard(cls, value: list[str]) -> list[str]:
        if "*" in value:
            raise ValueError("'*' não é permitido: liste as origens explicitamente")
        return [origin.rstrip("/") for origin in value]

    @field_validator("PUBLIC_APP_URL")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")

    @model_validator(mode="after")
    def _validate_consistency(self) -> Self:
        if self.OPENAPI_ENABLED is None:
            self.OPENAPI_ENABLED = self.ENVIRONMENT is not Environment.PRODUCTION
        if (self.JWT_PRIVATE_KEY is None) == (self.JWT_PRIVATE_KEY_FILE is None):
            raise ValueError("defina exatamente um entre JWT_PRIVATE_KEY e JWT_PRIVATE_KEY_FILE")
        if self.SESSION_MAX_LIFETIME_SECONDS < self.REFRESH_TOKEN_TTL_SECONDS:
            raise ValueError("SESSION_MAX_LIFETIME_SECONDS deve ser >= REFRESH_TOKEN_TTL_SECONDS")

        for name in (self.ACCESS_COOKIE_NAME, self.REFRESH_COOKIE_NAME):
            if name.startswith(("__Host-", "__Secure-")) and not self.COOKIE_SECURE:
                raise ValueError(f"o cookie {name} usa prefixo que exige COOKIE_SECURE=true")
        if self.ACCESS_COOKIE_NAME.startswith("__Host-") and self.COOKIE_DOMAIN:
            raise ValueError("cookies __Host- não podem definir Domain")
        if self.REFRESH_COOKIE_NAME.startswith("__Host-") and self.REFRESH_COOKIE_PATH != "/":
            raise ValueError("cookies __Host- exigem Path=/")

        if not _is_origin(self.PUBLIC_APP_URL):
            raise ValueError("PUBLIC_APP_URL deve ser uma origem (ex.: https://kb.empresa.com)")
        if self.EMAIL_BACKEND == "smtp" and not self.SMTP_HOST:
            raise ValueError("EMAIL_BACKEND=smtp exige SMTP_HOST")
        for provider in ("GOOGLE", "GITHUB"):
            client_id = getattr(self, f"OAUTH_{provider}_CLIENT_ID")
            secret = getattr(self, f"OAUTH_{provider}_CLIENT_SECRET")
            if (client_id is None) != (secret is None):
                raise ValueError(
                    f"defina OAUTH_{provider}_CLIENT_ID e OAUTH_{provider}_CLIENT_SECRET juntos"
                )

        if self.ENVIRONMENT is Environment.PRODUCTION:
            if self.SEED_DEV_USERS:
                raise ValueError("SEED_DEV_USERS não pode ser usado em produção")
            if not self.COOKIE_SECURE:
                raise ValueError("COOKIE_SECURE deve ser true em produção")
            if not self.TRUSTED_ORIGINS:
                raise ValueError("TRUSTED_ORIGINS é obrigatório em produção")
            # Mínimo do OWASP para Argon2id: m=19 MiB, t=2, p=1.
            if self.ARGON2_MEMORY_COST_KIB < 19456 or self.ARGON2_TIME_COST < 2:
                raise ValueError("parâmetros de Argon2id abaixo do mínimo recomendado")
            if not self.PUBLIC_APP_URL.startswith("https://"):
                raise ValueError("PUBLIC_APP_URL deve usar https em produção")
            if self.EMAIL_BACKEND == "memory":
                raise ValueError("EMAIL_BACKEND=memory é só para testes")
            if self.EMAIL_BACKEND == "smtp" and self.SMTP_SECURITY == "none":
                raise ValueError("SMTP sem TLS não é permitido em produção")
        return self

    @property
    def oauth_state_cookie_name(self) -> str:
        """Cookies do login social seguem o mesmo esquema dos de sessão (Secure em HTTPS)."""
        return "__Secure-kb_oauth_state" if self.COOKIE_SECURE else "kb_oauth_state"

    @property
    def oauth_signup_cookie_name(self) -> str:
        return "__Secure-kb_oauth_signup" if self.COOKIE_SECURE else "kb_oauth_signup"

    def private_key_pem(self) -> bytes:
        if self.JWT_PRIVATE_KEY is not None:
            return self.JWT_PRIVATE_KEY.get_secret_value().replace("\\n", "\n").encode()
        if self.JWT_PRIVATE_KEY_FILE is None:  # garantido pelo validador; checagem defensiva
            raise RuntimeError("chave privada JWT não configurada")
        return self.JWT_PRIVATE_KEY_FILE.read_bytes()

    def additional_public_keys_pem(self) -> str:
        parts = [self.JWT_ADDITIONAL_PUBLIC_KEYS.replace("\\n", "\n")]
        if self.JWT_ADDITIONAL_PUBLIC_KEYS_FILE is not None:
            parts.append(self.JWT_ADDITIONAL_PUBLIC_KEYS_FILE.read_text(encoding="utf-8"))
        return "\n".join(part for part in parts if part.strip())


@lru_cache
def get_settings() -> Settings:
    # AUTHSERVICE_ENV_FILE="" desliga a leitura do .env (os testes usam só o ambiente).
    env_file = os.environ.get("AUTHSERVICE_ENV_FILE", ".env") or None
    return Settings(_env_file=env_file)  # valores obrigatórios vêm do ambiente
