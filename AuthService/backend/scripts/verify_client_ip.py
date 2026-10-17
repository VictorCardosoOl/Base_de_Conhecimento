"""Verifica se um X-Forwarded-For forjado pelo cliente é ignorado (ADR-0006, ADR-0016).

Uso (onde DATABASE_URL aponta para o banco do AuthService):
    VERIFY_PASSWORD=... python -m backend.scripts.verify_client_ip \\
        --base-url https://kb.empresa.com --email conta-de-teste@empresa.com

Faz um login real pela URL pública (a mesma que o navegador usa) enviando
X-Forwarded-For com um IP de documentação (RFC 5737), lê no banco o IP gravado na
sessão criada e encerra essa sessão. Sai com 0 se o IP gravado não é o forjado e
com 1 se é (o limite por IP pode ser contornado).

A senha vem só da variável de ambiente VERIFY_PASSWORD: nunca de argumento (fica no
histórico do shell e na lista de processos) nem de arquivo. Use uma conta de teste.
"""

import argparse
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import UTC, datetime

from sqlalchemy import select

from backend.core.database import get_session_factory
from backend.models.session import UserSession
from backend.models.user import User
from backend.repositories.user_repository import normalize_email

FORGED_IP = "203.0.113.77"
USER_AGENT = "verify-client-ip/1"


def _post(
    opener: urllib.request.OpenerDirector,
    url: str,
    origin: str,
    body: dict[str, str] | None = None,
    forge: bool = False,
) -> int:
    request = urllib.request.Request(  # noqa: S310 (esquema validado em main: http/https)
        url,
        data=json.dumps(body).encode() if body is not None else b"",
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Origin": origin,
            "User-Agent": USER_AGENT,
            **({"X-Forwarded-For": FORGED_IP} if forge else {}),
        },
    )
    try:
        with opener.open(request, timeout=15) as response:
            return int(response.status)
    except urllib.error.HTTPError as exc:
        return exc.code


def _recorded_ip(email: str, since: datetime) -> str | None:
    with get_session_factory()() as db:
        statement = (
            select(UserSession.ip_address)
            .join(User, User.id == UserSession.user_id)
            .where(
                User.email == normalize_email(email),
                UserSession.user_agent == USER_AGENT,
                UserSession.created_at >= since,
            )
            .order_by(UserSession.created_at.desc())
            .limit(1)
        )
        return db.scalars(statement).first()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--base-url", required=True, help="URL pública da Base (sem barra final)")
    parser.add_argument("--email", required=True, help="email de uma conta de teste")
    parser.add_argument("--origin", help="Origin enviado (padrão: a própria --base-url)")
    args = parser.parse_args()

    password = os.environ.get("VERIFY_PASSWORD")
    if not password:
        print("Defina VERIFY_PASSWORD no ambiente (a senha não é aceita como argumento).")
        return 2
    base = args.base_url.rstrip("/")
    if not base.startswith(("http://", "https://")):
        print("--base-url deve começar com http:// ou https://")
        return 2
    origin = args.origin or base
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
    )

    since = datetime.now(UTC)
    status = _post(
        opener,
        f"{base}/auth/login",
        origin,
        body={"email": args.email, "password": password},
        forge=True,
    )
    if status != 200:
        print(f"Login recusado (HTTP {status}): confira a conta, a URL e o Origin.")
        return 2
    try:
        ip = _recorded_ip(args.email, since)
    finally:
        # Não deixa a sessão de verificação aberta.
        _post(opener, f"{base}/auth/logout", origin)

    if ip is None:
        print("Sessão criada, mas não encontrada no banco: DATABASE_URL é o do mesmo ambiente?")
        return 2
    if ip == FORGED_IP:
        print(f"FALHA: o IP gravado é o forjado ({FORGED_IP}). O cliente controla o IP.")
        return 1
    print(f"OK: IP gravado {ip}; o forjado ({FORGED_IP}) foi ignorado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
