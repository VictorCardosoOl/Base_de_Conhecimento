from fastapi import APIRouter, Response
from fastapi.responses import JSONResponse
from sqlalchemy import text

from backend.core.database import get_engine
from backend.core.logger import get_logger
from backend.core.tokens import get_key_set
from backend.schemas.user_schemas import HealthResponse, JwksResponse

router = APIRouter(tags=["Sistema"])
logger = get_logger(__name__)


@router.get(
    "/.well-known/jwks.json",
    response_model=JwksResponse,
    summary="Chaves públicas para validar os access tokens",
    description=(
        "Inclui a chave atual e as anteriores ainda válidas durante uma rotação. "
        "Serviços consumidores devem selecionar a chave pelo `kid` do JWT."
    ),
)
def jwks(response: Response) -> dict[str, list[dict[str, str]]]:
    response.headers["Cache-Control"] = "public, max-age=300"
    return get_key_set().jwks()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Verificar se o serviço e o banco estão no ar",
    responses={503: {"model": HealthResponse, "description": "Banco indisponível"}},
)
def health() -> HealthResponse | JSONResponse:
    try:
        with get_engine().connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        logger.exception("health_check_database_unavailable")
        return JSONResponse(status_code=503, content={"status": "degraded", "database": "down"})
    return HealthResponse(status="ok", database="up")
