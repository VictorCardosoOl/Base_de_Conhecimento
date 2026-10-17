"""Comandos administrativos.

  python -m backend.cli create-user --email admin@empresa.com --username admin \
      --name "Administrador" --role admin
  python -m backend.cli purge-expired
  python -m backend.cli seed-dev-users   # só desenvolvimento (SEED_DEV_USERS=true)
  python -m backend.cli delete-e2e-users # só desenvolvimento: limpa contas dos testes E2E

A senha é pedida interativamente (nunca por argumento, para não ficar no
histórico do shell). Em automação, use a variável AUTHSERVICE_NEW_USER_PASSWORD.
"""

import argparse
import getpass
import os
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete, or_, select

from backend.core.config import Environment, get_settings
from backend.core.database import get_engine, get_session_factory
from backend.core.errors import ConflictError
from backend.core.rate_limit import PostgresRateLimiter
from backend.models.account_token import AccountToken
from backend.models.oauth import OAuthLoginState, OAuthPendingSignup
from backend.models.session import UserSession
from backend.models.user import Role, User
from backend.services.user_service import UserService

_THIRTY_DAYS = timedelta(days=30)


def _read_password() -> str:
    from_env = os.environ.get("AUTHSERVICE_NEW_USER_PASSWORD")
    if from_env:
        return from_env
    password = getpass.getpass("Senha: ")
    if password != getpass.getpass("Confirme a senha: "):
        raise SystemExit("As senhas não conferem.")
    return password


def create_user(email: str, username: str, display_name: str, role: Role) -> None:
    with get_session_factory()() as db:
        try:
            user = UserService(db).create_user(
                email, _read_password(), role, username=username, display_name=display_name
            )
        except (ConflictError, ValueError) as exc:
            raise SystemExit(str(exc)) from exc
    print(f"Usuário criado: id={user.id} username={user.username} role={user.role}")


SEED_ROLES = (Role.ADMIN, Role.EDITOR, Role.USER)
# Usuário e nome padrão de cada conta de teste (SEED_<PAPEL>_USERNAME / _NAME trocam).
SEED_IDENTITIES = {
    Role.ADMIN: ("admin", "Administrador"),
    Role.EDITOR: ("editor", "Editor"),
    Role.USER: ("leitor", "Leitor"),
}


def seed_dev_users() -> None:
    """Cria um usuário de teste por papel, para testar cada nível de acesso localmente.

    Só roda com SEED_DEV_USERS=true e nunca em produção (a configuração é rejeitada).
    Credenciais em SEED_<PAPEL>_EMAIL / SEED_<PAPEL>_PASSWORD; usuário e nome em
    SEED_<PAPEL>_USERNAME / SEED_<PAPEL>_NAME (padrão: SEED_IDENTITIES). Idempotente:
    conta que já existe não é alterada (nem senha, nem papel, nem usuário).
    """
    settings = get_settings()
    if not settings.SEED_DEV_USERS:
        print("seed-dev-users: desativado (SEED_DEV_USERS=false); nada a fazer.")
        return
    if settings.ENVIRONMENT is Environment.PRODUCTION:  # defesa extra além da validação
        raise SystemExit("seed-dev-users não roda em produção.")

    with get_session_factory()() as db:
        service = UserService(db)
        for role in SEED_ROLES:
            prefix = f"SEED_{role.value.upper()}"
            email = os.environ.get(f"{prefix}_EMAIL")
            password = os.environ.get(f"{prefix}_PASSWORD")
            if not email or not password:
                raise SystemExit(f"Defina {prefix}_EMAIL e {prefix}_PASSWORD.")
            default_username, default_name = SEED_IDENTITIES[role]
            username = os.environ.get(f"{prefix}_USERNAME") or default_username
            display_name = os.environ.get(f"{prefix}_NAME") or default_name
            try:
                service.create_user(
                    email, password, role, username=username, display_name=display_name
                )
            except ConflictError:
                print(f"seed-dev-users: {role.value} já existe ({email}); mantido.")
                continue
            except ValueError as exc:
                raise SystemExit(f"{prefix}: {exc}") from exc
            print(f"seed-dev-users: {role.value} criado ({email}).")


def purge_expired() -> None:
    """Remove sessões expiradas/revogadas há mais de 30 dias, contadores vencidos e os
    registros temporários de links por email e do login social já vencidos."""
    cutoff = datetime.now(UTC)
    with get_session_factory()() as db:
        result = db.execute(
            delete(UserSession).where(
                or_(
                    UserSession.expires_at < cutoff,
                    UserSession.revoked_at < cutoff - _THIRTY_DAYS,
                )
            )
        )
        temporary = sum(
            getattr(db.execute(statement), "rowcount", 0) or 0
            for statement in (
                delete(AccountToken).where(
                    or_(AccountToken.expires_at < cutoff, AccountToken.used_at.is_not(None))
                ),
                delete(OAuthLoginState).where(OAuthLoginState.expires_at < cutoff),
                delete(OAuthPendingSignup).where(OAuthPendingSignup.expires_at < cutoff),
            )
        )
        db.commit()
    buckets = PostgresRateLimiter(get_engine()).purge_expired()
    removed = getattr(result, "rowcount", 0)
    print(
        f"Sessões removidas: {removed}; contadores removidos: {buckets}; "
        f"links e estados temporários removidos: {temporary}"
    )


# Emails que os testes E2E da Base de Conhecimento criam (cadastro-<n>@ e e2e-<n>@).
E2E_EMAIL_PATTERN = r"^(cadastro|e2e)-[0-9]+@exemplo\.com\.br$"


def delete_e2e_users() -> int:
    """Apaga as contas criadas pelos testes E2E no banco local (limpeza automática).

    Só em desenvolvimento (SEED_DEV_USERS=true, nunca em produção) e só emails no padrão
    dos testes: nenhuma outra conta é tocada. Sessões, pedidos, vínculos e aceites caem
    junto (ON DELETE CASCADE).
    """
    settings = get_settings()
    if settings.ENVIRONMENT is Environment.PRODUCTION or not settings.SEED_DEV_USERS:
        raise SystemExit("delete-e2e-users só roda em desenvolvimento (SEED_DEV_USERS=true).")
    with get_session_factory()() as db:
        ids = list(db.scalars(select(User.id).where(User.email.regexp_match(E2E_EMAIL_PATTERN))))
        if ids:
            db.execute(delete(User).where(User.id.in_(ids)))
            db.commit()
    print(f"delete-e2e-users: {len(ids)} conta(s) de teste removida(s).")
    return len(ids)


def main() -> None:
    parser = argparse.ArgumentParser(description="Administração do AuthService")
    commands = parser.add_subparsers(dest="command", required=True)

    create = commands.add_parser("create-user", help="cria um usuário")
    create.add_argument("--email", required=True)
    create.add_argument("--username", required=True, help="identificador único (ex.: maria.silva)")
    create.add_argument("--name", required=True, help="nome de exibição")
    create.add_argument("--role", choices=[role.value for role in Role], default=Role.USER.value)

    commands.add_parser("purge-expired", help="limpa sessões e contadores vencidos")
    commands.add_parser("seed-dev-users", help="cria usuários de teste (só desenvolvimento)")
    commands.add_parser(
        "delete-e2e-users", help="apaga as contas criadas pelos testes E2E (só desenvolvimento)"
    )

    args = parser.parse_args()
    if args.command == "create-user":
        create_user(args.email, args.username, args.name, Role(args.role))
    elif args.command == "seed-dev-users":
        seed_dev_users()
    elif args.command == "delete-e2e-users":
        delete_e2e_users()
    else:
        purge_expired()


if __name__ == "__main__":
    main()
