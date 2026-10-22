FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PYTHONPATH=/code

WORKDIR /code

# Usuário sem privilégios: o processo não roda como root.
RUN useradd --create-home --uid 10001 app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY alembic.ini ./
COPY migrations ./migrations
COPY backend ./backend
COPY frontend ./frontend

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3).status == 200 else 1)"

# Migrations NÃO rodam no boot: execute `alembic upgrade head` como etapa de release.
# O IP do cliente é resolvido pela aplicação (TRUSTED_PROXY_COUNT), não pelo uvicorn.
# --timeout-keep-alive 75: o padrão do uvicorn (5 s) fecha conexões ociosas antes do
# cliente HTTP do Next desistir delas; o Next reaproveitava um socket já fechado e a
# requisição falhava com ECONNRESET. Com o servidor esperando mais que o cliente, quem
# encerra a conexão ociosa é sempre o cliente.
CMD ["uvicorn", "backend.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--no-proxy-headers", "--timeout-keep-alive", "75"]
