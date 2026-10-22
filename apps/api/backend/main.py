from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.admin_routes import router as admin_router
from backend.api.auth_routes import router as auth_router
from backend.api.content_routes import router as content_router
from backend.api.error_handlers import register_error_handlers
from backend.api.middleware import make_csrf_origin_middleware, make_security_headers_middleware
from backend.api.oauth_routes import router as oauth_router
from backend.api.openapi import install_openapi
from backend.api.system_routes import router as system_router
from backend.core.config import Environment, Settings, get_settings
from backend.core.logger import configure_logging, get_logger
from backend.core.tokens import get_key_set

logger = get_logger(__name__)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    logger.info("authservice_started")
    yield
    logger.info("authservice_stopped")


def deployment_warnings(settings: Settings) -> list[str]:
    """Configurações válidas, mas que anulam proteções em produção (logadas no boot).

    Não impedem a subida: a topologia (proxy à frente ou não) só é conhecida na implantação.
    """
    if settings.ENVIRONMENT != Environment.PRODUCTION:
        return []
    warnings: list[str] = []
    if settings.TRUSTED_PROXY_COUNT == 0:
        warnings.append(
            "TRUSTED_PROXY_COUNT=0: atrás de proxy (ex.: o rewrite do Next), todas as requisições "
            "chegam com o IP do proxy e os limites por IP viram um limite global (um atacante "
            "bloqueia o login de todos). Configure o proxy de borda para sobrescrever o "
            "X-Forwarded-For e ajuste TRUSTED_PROXY_COUNT (docs/adr/0016)."
        )
    if settings.OPENAPI_ENABLED:
        warnings.append("OPENAPI_ENABLED=true em produção: /docs e /openapi.json ficam públicos.")
    return warnings


def create_app() -> FastAPI:
    """Fábrica da aplicação (uvicorn backend.main:create_app --factory)."""
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL)
    get_key_set()  # falha no boot se a chave estiver ausente ou inválida
    for warning in deployment_warnings(settings):
        logger.warning("deployment_warning %s", warning)

    app = FastAPI(
        title="AuthService",
        description=(
            "Autenticação com sessões persistentes, access token JWT EdDSA de vida curta "
            "e refresh token rotativo em cookie HttpOnly. Não há cadastro público."
        ),
        version="2.0.0",
        lifespan=lifespan,
        openapi_url="/openapi.json" if settings.OPENAPI_ENABLED else None,
        docs_url="/docs" if settings.OPENAPI_ENABLED else None,
        redoc_url=None,
    )

    register_error_handlers(app)
    # A última camada adicionada é a mais externa.
    app.middleware("http")(make_csrf_origin_middleware(settings))
    app.middleware("http")(make_security_headers_middleware(settings))
    if settings.CORS_ALLOWED_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.CORS_ALLOWED_ORIGINS,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
            allow_headers=["Content-Type", "Authorization"],
        )

    app.include_router(system_router)
    app.include_router(auth_router)
    app.include_router(oauth_router)
    app.include_router(admin_router)
    app.include_router(content_router)
    install_openapi(app)

    # Frontend de demonstração, montado por último para não sombrear a API.
    if FRONTEND_DIR.is_dir():
        app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    return app
