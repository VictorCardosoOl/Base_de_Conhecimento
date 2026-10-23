"""papel editor e troca obrigatoria de senha

Revision ID: b7d1c2e4f901
Revises: 00549604ef46
Create Date: 2026-09-27 20:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b7d1c2e4f901"
down_revision: str | Sequence[str] | None = "00549604ef46"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint(op.f("ck_users_role_valid"), "users", schema="app_auth", type_="check")
    op.create_check_constraint(
        op.f("ck_users_role_valid"),
        "users",
        "role IN ('admin', 'editor', 'user')",
        schema="app_auth",
    )
    op.add_column(
        "users",
        sa.Column(
            "must_change_password",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        schema="app_auth",
    )


def downgrade() -> None:
    # Sem perda silenciosa: editores voltam a ser usuários comuns antes de restringir o papel.
    op.execute("UPDATE app_auth.users SET role = 'user' WHERE role = 'editor'")
    op.drop_column("users", "must_change_password", schema="app_auth")
    op.drop_constraint(op.f("ck_users_role_valid"), "users", schema="app_auth", type_="check")
    op.create_check_constraint(
        op.f("ck_users_role_valid"),
        "users",
        "role IN ('admin', 'user')",
        schema="app_auth",
    )
