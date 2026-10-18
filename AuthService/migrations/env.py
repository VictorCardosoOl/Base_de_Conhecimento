from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine, pool, text

from backend.core.config import get_settings
from backend.models import Base
from backend.models.base import AUTH_SCHEMA

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = Base.metadata


def _database_url() -> str:
    # Permite apontar para outro banco (ex.: testes) sem tocar no ambiente global.
    override = config.attributes.get("database_url")
    if isinstance(override, str):
        return override
    return get_settings().DATABASE_URL.get_secret_value()


def run_migrations_offline() -> None:
    context.configure(
        url=_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        include_schemas=True,
        version_table_schema=AUTH_SCHEMA,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(_database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        # O schema precisa existir antes da tabela de versões do Alembic.
        connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{AUTH_SCHEMA}"'))
        connection.commit()
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_schemas=True,
            version_table_schema=AUTH_SCHEMA,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
