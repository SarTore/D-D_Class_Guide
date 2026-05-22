"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-22

Esta migração foi escrita à mão como ponto de partida; nas próximas, use
`alembic revision --autogenerate -m "..."` para gerar a partir dos modelos.
Para inspecionar o SQL sem aplicar: `alembic upgrade head --sql`.
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

JSONB = postgresql.JSONB(astext_type=sa.Text())


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=320), unique=True, nullable=True),
        sa.Column("display_name", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "characters",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), index=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("race", sa.String(length=60), nullable=False),
        sa.Column("char_class", sa.String(length=60), nullable=False),
        sa.Column("subclass", sa.String(length=80), nullable=True),
        sa.Column("level", sa.Integer, server_default="1"),
        sa.Column("background", sa.String(length=80), nullable=True),
        sa.Column("motivation", sa.String(length=280), nullable=True),
        sa.Column("str", sa.Integer, server_default="10"),
        sa.Column("dex", sa.Integer, server_default="10"),
        sa.Column("con", sa.Integer, server_default="10"),
        sa.Column("int", sa.Integer, server_default="10"),
        sa.Column("wis", sa.Integer, server_default="10"),
        sa.Column("cha", sa.Integer, server_default="10"),
        sa.Column("ac", sa.Integer, server_default="10"),
        sa.Column("max_hp", sa.Integer, server_default="1"),
        sa.Column("skills", JSONB, server_default="[]"),
        sa.Column("spells", JSONB, server_default="[]"),
        sa.Column("feats", JSONB, server_default="[]"),
        sa.Column("equipment", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "campaigns",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("character_id", sa.String(length=36), sa.ForeignKey("characters.id", ondelete="CASCADE"), index=True),
        sa.Column("title", sa.String(length=160), server_default="Campanha sem título"),
        sa.Column("tone", sa.String(length=40), server_default="heroico"),
        sa.Column("state", JSONB, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "messages",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("campaign_id", sa.String(length=36), sa.ForeignKey("campaigns.id", ondelete="CASCADE"), index=True),
        sa.Column("role", sa.String(length=16), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "classes",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=60), unique=True, nullable=False),
        sa.Column("hit_die", sa.Integer, nullable=False),
        sa.Column("primary_ability", sa.String(length=80), nullable=False),
        sa.Column("saves", sa.String(length=80), nullable=False),
        sa.Column("asi_levels", JSONB, server_default="[]"),
        sa.Column("caster_type", sa.String(length=20), nullable=True),
    )

    op.create_table(
        "subclasses",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("class_id", sa.Integer, sa.ForeignKey("classes.id", ondelete="CASCADE"), index=True),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("srd", sa.Boolean, server_default=sa.false()),
        sa.Column("blurb", sa.Text, nullable=True),
        sa.UniqueConstraint("class_id", "name", name="uq_subclass_class_name"),
    )

    op.create_table(
        "class_features",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("class_id", sa.Integer, sa.ForeignKey("classes.id", ondelete="CASCADE"), index=True),
        sa.Column("level", sa.Integer, index=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
    )

    op.create_table(
        "subclass_features",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("subclass_id", sa.Integer, sa.ForeignKey("subclasses.id", ondelete="CASCADE"), index=True),
        sa.Column("level", sa.Integer, index=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
    )

    op.create_table(
        "spells",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), unique=True, nullable=False),
        sa.Column("level", sa.Integer, index=True),
        sa.Column("school", sa.String(length=40), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("classes", JSONB, server_default="[]"),
    )

    op.create_table(
        "feats",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), unique=True, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
    )


def downgrade() -> None:
    for t in (
        "feats", "spells", "subclass_features", "class_features",
        "subclasses", "classes", "messages", "campaigns", "characters", "users",
    ):
        op.drop_table(t)
