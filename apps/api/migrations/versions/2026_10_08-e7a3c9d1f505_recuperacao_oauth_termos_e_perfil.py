"""recuperacao de senha, confirmacao de email, login social, termos e perfil

Revision ID: e7a3c9d1f505
Revises: d4f2b9a7c303
Create Date: 2026-10-08 10:00:00.000000

- users: senha opcional (contas de login social), data de confirmação do email e perfil
  complementar opcional (organização e área de atuação);
- account_tokens: links de uso único (redefinição de senha, confirmação de email);
- oauth_identities / oauth_states / oauth_pending_signups: login social (ADR-0013);
- terms_acceptances: aceite dos Termos e da Política de Privacidade (ADR-0014).

Contas existentes continuam com o email não confirmado (não há como saber se foi
comprovado) e sem registro de aceite: as duas decisões estão nos ADRs 0012 e 0014.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e7a3c9d1f505"
down_revision: str | Sequence[str] | None = "d4f2b9a7c303"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_AREAS = (
    "seguranca_trabalho",
    "saude_ocupacional",
    "rh_dp",
    "contabil_financeiro",
    "juridico",
    "ti",
    "gestao",
    "outra",
)


def _now() -> sa.TextClause:
    return sa.text("now()")


def upgrade() -> None:
    # ── users ────────────────────────────────────────────────────────────────
    op.alter_column("users", "password_hash", nullable=True, schema="app_auth")
    op.add_column(
        "users", sa.Column("email_verified_at", sa.DateTime(timezone=True)), schema="app_auth"
    )
    op.add_column("users", sa.Column("organization", sa.String(length=120)), schema="app_auth")
    op.add_column("users", sa.Column("professional_area", sa.String(length=40)), schema="app_auth")
    areas = ", ".join(f"'{area}'" for area in _AREAS)
    op.create_check_constraint(
        op.f("ck_users_professional_area_valid"),
        "users",
        f"professional_area IS NULL OR professional_area IN ({areas})",
        schema="app_auth",
    )
    op.create_check_constraint(
        op.f("ck_users_organization_not_blank"),
        "users",
        "organization IS NULL OR length(btrim(organization)) > 0",
        schema="app_auth",
    )

    # ── account_tokens ───────────────────────────────────────────────────────
    op.create_table(
        "account_tokens",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("purpose", sa.String(length=30), nullable=False),
        sa.Column("token_hash", sa.CHAR(length=64), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True)),
        sa.CheckConstraint(
            "purpose IN ('password_reset', 'email_verification')",
            name=op.f("ck_account_tokens_purpose_valid"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_account_tokens_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_account_tokens")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_account_tokens_token_hash")),
        schema="app_auth",
    )
    op.create_index(
        "ix_account_tokens_user_purpose",
        "account_tokens",
        ["user_id", "purpose"],
        schema="app_auth",
    )
    op.create_index(
        op.f("ix_auth_account_tokens_expires_at"),
        "account_tokens",
        ["expires_at"],
        schema="app_auth",
    )

    # ── oauth_identities ─────────────────────────────────────────────────────
    op.create_table(
        "oauth_identities",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_oauth_identities_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_oauth_identities")),
        schema="app_auth",
    )
    op.create_index(
        "ux_oauth_identities_provider_subject",
        "oauth_identities",
        ["provider", "subject"],
        unique=True,
        schema="app_auth",
    )
    op.create_index(
        "ux_oauth_identities_user_provider",
        "oauth_identities",
        ["user_id", "provider"],
        unique=True,
        schema="app_auth",
    )

    # ── oauth_states ─────────────────────────────────────────────────────────
    op.create_table(
        "oauth_states",
        sa.Column("state_hash", sa.CHAR(length=64), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("code_verifier", sa.String(length=128), nullable=False),
        sa.Column("next_path", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("state_hash", name=op.f("pk_oauth_states")),
        schema="app_auth",
    )
    op.create_index(
        op.f("ix_auth_oauth_states_expires_at"), "oauth_states", ["expires_at"], schema="app_auth"
    )

    # ── oauth_pending_signups ────────────────────────────────────────────────
    op.create_table(
        "oauth_pending_signups",
        sa.Column("token_hash", sa.CHAR(length=64), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("suggested_name", sa.String(length=100)),
        sa.Column("suggested_username", sa.String(length=30)),
        sa.Column("next_path", sa.String(length=512), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("token_hash", name=op.f("pk_oauth_pending_signups")),
        schema="app_auth",
    )
    op.create_index(
        op.f("ix_auth_oauth_pending_signups_expires_at"),
        "oauth_pending_signups",
        ["expires_at"],
        schema="app_auth",
    )

    # ── terms_acceptances ────────────────────────────────────────────────────
    op.create_table(
        "terms_acceptances",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("terms_version", sa.String(length=20), nullable=False),
        sa.Column("privacy_version", sa.String(length=20), nullable=False),
        sa.Column("method", sa.String(length=20), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), server_default=_now(), nullable=False),
        sa.Column("ip_address", sa.String(length=45)),
        sa.CheckConstraint(
            "method IN ('password', 'oauth')", name=op.f("ck_terms_acceptances_method_valid")
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["app_auth.users.id"],
            name=op.f("fk_terms_acceptances_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_terms_acceptances")),
        schema="app_auth",
    )
    op.create_index(
        op.f("ix_auth_terms_acceptances_user_id"),
        "terms_acceptances",
        ["user_id"],
        schema="app_auth",
    )


def downgrade() -> None:
    op.drop_table("terms_acceptances", schema="app_auth")
    op.drop_table("oauth_pending_signups", schema="app_auth")
    op.drop_table("oauth_states", schema="app_auth")
    op.drop_table("oauth_identities", schema="app_auth")
    op.drop_table("account_tokens", schema="app_auth")
    op.drop_constraint(
        op.f("ck_users_organization_not_blank"), "users", schema="app_auth", type_="check"
    )
    op.drop_constraint(
        op.f("ck_users_professional_area_valid"), "users", schema="app_auth", type_="check"
    )
    op.drop_column("users", "professional_area", schema="app_auth")
    op.drop_column("users", "organization", schema="app_auth")
    op.drop_column("users", "email_verified_at", schema="app_auth")
    # Contas só com login social não têm senha: o downgrade falha se existir alguma
    # (NOT NULL). Remova-as ou defina uma senha antes de voltar a versão.
    op.alter_column("users", "password_hash", nullable=False, schema="app_auth")
