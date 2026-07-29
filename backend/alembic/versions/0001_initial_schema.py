"""Initial schema: users, entries, audit_flags, chat_messages

Revision ID: 0001
Revises:
Create Date: 2026-07-29 10:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.execute(
        "CREATE TYPE entry_type_enum AS ENUM ('expense', 'income')"
    )
    op.execute(
        "CREATE TYPE source_enum AS ENUM ('manual', 'ai')"
    )

    op.create_table(
        "entries",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("entry_type", sa.Enum("expense", "income", name="entry_type_enum", create_type=False), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=True),
        sa.Column("source", sa.Enum("manual", "ai", name="source_enum", create_type=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_entries_entry_date", "entries", ["entry_date"])
    op.create_index("ix_entries_entry_type", "entries", ["entry_type"])
    op.create_index("ix_entries_category", "entries", ["category"])

    op.execute(
        "CREATE TYPE severity_enum AS ENUM ('low', 'medium', 'high')"
    )

    op.create_table(
        "audit_flags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("period", sa.String(7), nullable=False),
        sa.Column("entry_id", UUID(as_uuid=True), sa.ForeignKey("entries.id", ondelete="CASCADE"), nullable=False),
        sa.Column("flag_reason", sa.String(255), nullable=False),
        sa.Column("severity", sa.Enum("low", "medium", "high", name="severity_enum", create_type=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_audit_flags_period", "audit_flags", ["period"])

    op.execute(
        "CREATE TYPE role_enum AS ENUM ('user', 'assistant')"
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("role", sa.Enum("user", "assistant", name="role_enum", create_type=False), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("tool_calls", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
    op.execute("DROP TYPE IF EXISTS role_enum")
    op.drop_table("audit_flags")
    op.execute("DROP TYPE IF EXISTS severity_enum")
    op.drop_table("entries")
    op.execute("DROP TYPE IF EXISTS entry_type_enum")
    op.execute("DROP TYPE IF EXISTS source_enum")
    op.drop_table("users")
