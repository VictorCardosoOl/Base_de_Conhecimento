"""avaliacoes, sugestoes de correcao e comentarios dos artigos (ADR-0015)

Revision ID: f1b4d8e2a706
Revises: e7a3c9d1f505
Create Date: 2026-10-10 09:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "f1b4d8e2a706"
down_revision: str | Sequence[str] | None = "e7a3c9d1f505"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "article_comments",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("article_id", sa.String(length=120), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("parent_id", sa.Uuid(), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_by", sa.Uuid(), nullable=True),
        sa.CheckConstraint(
            "article_id ~ '^[a-z0-9][a-z0-9-]{0,119}$'",
            name=op.f("ck_article_comments_article_id_format"),
        ),
        sa.CheckConstraint(
            "length(btrim(body)) BETWEEN 2 AND 2000", name=op.f("ck_article_comments_body_length")
        ),
        sa.ForeignKeyConstraint(
            ["deleted_by"],
            ["app_auth.users.id"],
            name=op.f("fk_article_comments_deleted_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["parent_id"],
            ["app_auth.article_comments.id"],
            name=op.f("fk_article_comments_parent_id_article_comments"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_article_comments_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_article_comments")),
        schema="app_auth",
    )
    op.create_index(
        "ix_article_comments_article_created",
        "article_comments",
        ["article_id", "created_at"],
        unique=False,
        schema="app_auth",
    )
    op.create_index(
        "ix_article_comments_created",
        "article_comments",
        ["created_at"],
        unique=False,
        schema="app_auth",
    )
    op.create_index(
        "ix_article_comments_parent", "article_comments", ["parent_id"], unique=False, schema="app_auth"
    )
    op.create_table(
        "article_corrections",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("article_id", sa.String(length=120), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", sa.Uuid(), nullable=True),
        sa.Column("resolution_note", sa.String(length=500), nullable=True),
        sa.CheckConstraint(
            "article_id ~ '^[a-z0-9][a-z0-9-]{0,119}$'",
            name=op.f("ck_article_corrections_article_id_format"),
        ),
        sa.CheckConstraint(
            "kind IN ('erro', 'desatualizado', 'inconsistencia', 'outro')",
            name=op.f("ck_article_corrections_kind_valid"),
        ),
        sa.CheckConstraint(
            "status IN ('open', 'resolved', 'rejected')",
            name=op.f("ck_article_corrections_status_valid"),
        ),
        sa.CheckConstraint(
            "excerpt IS NULL OR length(excerpt) <= 1000",
            name=op.f("ck_article_corrections_excerpt_length"),
        ),
        sa.CheckConstraint(
            "length(btrim(description)) BETWEEN 10 AND 2000",
            name=op.f("ck_article_corrections_description_length"),
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by"],
            ["app_auth.users.id"],
            name=op.f("fk_article_corrections_resolved_by_users"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_article_corrections_user_id_users"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_article_corrections")),
        schema="app_auth",
    )
    op.create_index(
        "ix_article_corrections_article",
        "article_corrections",
        ["article_id"],
        unique=False,
        schema="app_auth",
    )
    op.create_index(
        "ix_article_corrections_status_created",
        "article_corrections",
        ["status", "created_at"],
        unique=False,
        schema="app_auth",
    )
    op.create_table(
        "article_ratings",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("article_id", sa.String(length=120), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("value", sa.SmallInteger(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "article_id ~ '^[a-z0-9][a-z0-9-]{0,119}$'",
            name=op.f("ck_article_ratings_article_id_format"),
        ),
        sa.CheckConstraint("value BETWEEN 1 AND 5", name=op.f("ck_article_ratings_value_range")),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_article_ratings_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_article_ratings")),
        sa.UniqueConstraint("article_id", "user_id", name="uq_article_ratings_article_user"),
        schema="app_auth",
    )


def downgrade() -> None:
    op.drop_table("article_ratings", schema="app_auth")
    op.drop_index(
        "ix_article_corrections_status_created", table_name="article_corrections", schema="app_auth"
    )
    op.drop_index("ix_article_corrections_article", table_name="article_corrections", schema="app_auth")
    op.drop_table("article_corrections", schema="app_auth")
    op.drop_index("ix_article_comments_parent", table_name="article_comments", schema="app_auth")
    op.drop_index("ix_article_comments_created", table_name="article_comments", schema="app_auth")
    op.drop_index(
        "ix_article_comments_article_created", table_name="article_comments", schema="app_auth"
    )
    op.drop_table("article_comments", schema="app_auth")
