"""add character guide fields (background, motivation, ac, max_hp, equipment)

Template de migração Alembic. AJUSTES NECESSÁRIOS antes de aplicar:
  1. Coloque o arquivo em alembic/versions/ com o nome que o Alembic espera.
  2. Defina down_revision = <id da sua última revisão> (ex.: "0001").
  3. REMOVA do upgrade()/downgrade() qualquer coluna que JÁ exista na sua
     tabela characters (ex.: se ac/max_hp já existem, tire-os daqui).

Alternativa recomendada: depois de atualizar o seu model SQLAlchemy, rode
    alembic revision --autogenerate -m "campos do guia de personagem"
e o Alembic gera o SQL exato comparando com o banco (em vez de usar este
template manual).

Revision ID: a1b2c3d4e5f6
Revises: 0001
Create Date: 2026-05-26
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "0001"  # <-- ajuste para o id da sua última revisão
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Campos novos do guia. server_default garante linhas existentes válidas;
    # remova o server_default depois se não quiser default no banco.
    op.add_column("characters", sa.Column("background", sa.String(), nullable=True))
    op.add_column("characters", sa.Column("motivation", sa.String(), nullable=True))
    op.add_column("characters", sa.Column("ac", sa.Integer(), nullable=False, server_default="10"))
    op.add_column("characters", sa.Column("max_hp", sa.Integer(), nullable=False, server_default="1"))
    op.add_column("characters", sa.Column("equipment", sa.Text(), nullable=True))

    # Se skills/spells ainda forem texto e você quiser migrar para JSONB, faça
    # numa migração própria com USING para converter os dados existentes, p.ex.:
    #   op.execute("ALTER TABLE characters ALTER COLUMN skills TYPE jsonb "
    #              "USING to_jsonb(string_to_array(skills, ', '))")


def downgrade() -> None:
    op.drop_column("characters", "equipment")
    op.drop_column("characters", "max_hp")
    op.drop_column("characters", "ac")
    op.drop_column("characters", "motivation")
    op.drop_column("characters", "background")
