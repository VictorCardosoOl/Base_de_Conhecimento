"""solicitacoes de papel (usuario pede para virar editor)

Revision ID: c3e8a1f5d202
Revises: b7d1c2e4f901
Create Date: 2026-09-28 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c3e8a1f5d202"
down_revision: str | Sequence[str] | None = "b7d1c2e4f901"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "role_requests",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("requested_role", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("decided_by", sa.Uuid(), nullable=True),
        sa.CheckConstraint(
            "requested_role IN ('editor')", name=op.f("ck_role_requests_requested_role_valid")
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name=op.f("ck_role_requests_status_valid"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_role_requests_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["decided_by"],
            ["app_auth.users.id"],
            name=op.f("fk_role_requests_decided_by_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_role_requests")),
        schema="app_auth",
    )
    op.create_index(
        "ux_role_requests_one_pending_per_user",
        "role_requests",
        ["user_id"],
        unique=True,
        schema="app_auth",
        postgresql_where=sa.text("status = 'pending'"),
    )
    op.create_index(
        "ix_role_requests_status_created",
        "role_requests",
        ["status", "created_at"],
        unique=False,
        schema="app_auth",
    )


def downgrade() -> None:
    op.drop_index("ix_role_requests_status_created", table_name="role_requests", schema="app_auth")
    op.drop_index(
        "ux_role_requests_one_pending_per_user", table_name="role_requests", schema="app_auth"
    )
    op.drop_table("role_requests", schema="app_auth")
