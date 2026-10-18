from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

_ERROR_RESPONSE_REF = {"$ref": "#/components/schemas/ErrorResponse"}


def install_openapi(app: FastAPI) -> None:
    """Faz o OpenAPI refletir o formato real dos erros de validação.

    O FastAPI documenta automaticamente `422 HTTPValidationError`, mas o handler
    de validação responde `400` com `{"error": {"code": "VALIDATION_ERROR", ...}}`.
    """

    def openapi() -> dict[str, Any]:
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title=app.title,
            version=app.version,
            description=app.description,
            routes=app.routes,
        )
        for operations in schema.get("paths", {}).values():
            for operation in operations.values():
                responses = operation.get("responses", {})
                if responses.pop("422", None) is not None:
                    responses.setdefault(
                        "400",
                        {
                            "description": "Dados inválidos (VALIDATION_ERROR)",
                            "content": {"application/json": {"schema": _ERROR_RESPONSE_REF}},
                        },
                    )
        components = schema.get("components", {}).get("schemas", {})
        components.pop("HTTPValidationError", None)
        components.pop("ValidationError", None)

        app.openapi_schema = schema
        return schema

    app.openapi = openapi  # type: ignore[method-assign]
