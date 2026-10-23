"""usuario (username unico) e nome de exibicao

Revision ID: d4f2b9a7c303
Revises: c3e8a1f5d202
Create Date: 2026-10-01 10:00:00.000000

Contas que já existem recebem valores derivados do email (parte antes do @), para que as
colunas possam ser NOT NULL. Usuários repetidos ganham um sufixo do id. Os valores podem ser
trocados depois (ex.: os usuários de teste viram admin, editor e leitor).
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4f2b9a7c303"
down_revision: str | Sequence[str] | None = "c3e8a1f5d202"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

USERNAME_PATTERN = r"^[a-z0-9][a-z0-9._-]{2,29}$"

_BACKFILL = """
WITH base AS (
    SELECT
        id,
        split_part(email, '@', 1) AS local_part,
        left(
            regexp_replace(
                regexp_replace(lower(split_part(email, '@', 1)), '[^a-z0-9._-]', '', 'g'),
                '^[^a-z0-9]+', ''
            ),
            22
        ) AS candidate
    FROM app_auth.users
),
normalized AS (
    SELECT
        id,
        local_part,
        CASE WHEN length(candidate) >= 3 THEN candidate ELSE 'usuario' END AS candidate
    FROM base
),
ranked AS (
    SELECT
        id,
        local_part,
        candidate,
        row_number() OVER (PARTITION BY candidate ORDER BY id) AS position
    FROM normalized
)
UPDATE app_auth.users AS u
SET
    username = CASE
        WHEN r.position = 1 THEN r.candidate
        ELSE r.candidate || '-' || left(replace(u.id::text, '-', ''), 7)
    END,
    display_name = r.local_part
FROM ranked AS r
WHERE u.id = r.id
"""


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(length=30)), schema="app_auth")
    op.add_column("users", sa.Column("display_name", sa.String(length=100)), schema="app_auth")
    op.execute(_BACKFILL)
    op.alter_column("users", "username", nullable=False, schema="app_auth")
    op.alter_column("users", "display_name", nullable=False, schema="app_auth")
    op.create_unique_constraint(op.f("uq_users_username"), "users", ["username"], schema="app_auth")
    op.create_check_constraint(
        op.f("ck_users_username_format"),
        "users",
        f"username ~ '{USERNAME_PATTERN}'",
        schema="app_auth",
    )
    op.create_check_constraint(
        op.f("ck_users_display_name_not_blank"),
        "users",
        "length(btrim(display_name)) > 0",
        schema="app_auth",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("ck_users_display_name_not_blank"), "users", schema="app_auth", type_="check"
    )
    op.drop_constraint(op.f("ck_users_username_format"), "users", schema="app_auth", type_="check")
    op.drop_constraint(op.f("uq_users_username"), "users", schema="app_auth", type_="unique")
    op.drop_column("users", "display_name", schema="app_auth")
    op.drop_column("users", "username", schema="app_auth")
