"""Exporta o contrato OpenAPI para docs/openapi.json.

Uso: python -m backend.scripts.export_openapi

Um teste compara o arquivo versionado com o gerado: mudar a API sem
atualizar o contrato quebra o CI.
"""

import json
from pathlib import Path

from backend.main import create_app

OUTPUT = Path(__file__).resolve().parents[2] / "docs" / "openapi.json"


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    schema = create_app().openapi()
    OUTPUT.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n"
    )
    print(f"Contrato exportado para {OUTPUT}")


if __name__ == "__main__":
    main()
