"""
Modelos SQLAlchemy — a fonte de verdade do esquema do banco.
O Alembic faz autogenerate a partir daqui (ver alembic/env.py).

Duas famílias de tabelas:
  1. Jogo (mutável por usuário): users, characters, campaigns, messages
  2. Referência (somente leitura, semeada do SRD): classes, subclasses,
     class_features, subclass_features, spells, feats
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# 1. TABELAS DE JOGO
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    email: Mapped[str | None] = mapped_column(String(320), unique=True, nullable=True)
    display_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    characters: Mapped[list["Character"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Character(Base):
    __tablename__ = "characters"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    name: Mapped[str] = mapped_column(String(120))
    race: Mapped[str] = mapped_column(String(60))
    char_class: Mapped[str] = mapped_column(String(60))
    subclass: Mapped[str | None] = mapped_column(String(80), nullable=True)
    level: Mapped[int] = mapped_column(Integer, default=1)
    background: Mapped[str | None] = mapped_column(String(80), nullable=True)
    motivation: Mapped[str | None] = mapped_column(String(280), nullable=True)

    # Atributos
    str_: Mapped[int] = mapped_column("str", Integer, default=10)
    dex: Mapped[int] = mapped_column(Integer, default=10)
    con: Mapped[int] = mapped_column(Integer, default=10)
    int_: Mapped[int] = mapped_column("int", Integer, default=10)
    wis: Mapped[int] = mapped_column(Integer, default=10)
    cha: Mapped[int] = mapped_column(Integer, default=10)

    ac: Mapped[int] = mapped_column(Integer, default=10)
    max_hp: Mapped[int] = mapped_column(Integer, default=1)

    # Listas flexíveis (perícias treinadas, magias conhecidas, decisões de ASI/talento)
    skills: Mapped[list] = mapped_column(JSONB, default=list)
    spells: Mapped[list] = mapped_column(JSONB, default=list)
    feats: Mapped[list] = mapped_column(JSONB, default=list)
    equipment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="characters")
    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="character", cascade="all, delete-orphan")


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    character_id: Mapped[str] = mapped_column(ForeignKey("characters.id", ondelete="CASCADE"), index=True)

    title: Mapped[str] = mapped_column(String(160), default="Campanha sem título")
    tone: Mapped[str] = mapped_column(String(40), default="heroico")

    # Estado mutável da campanha: hp atual, ouro, condições, localização,
    # inventário, xp, missões, espaços de magia, inspiração.
    state: Mapped[dict] = mapped_column(JSONB, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    character: Mapped["Character"] = relationship(back_populates="campaigns")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="campaign", cascade="all, delete-orphan", order_by="Message.created_at"
    )


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=_uuid)
    campaign_id: Mapped[str] = mapped_column(ForeignKey("campaigns.id", ondelete="CASCADE"), index=True)

    role: Mapped[str] = mapped_column(String(16))  # 'user' | 'assistant'
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campaign: Mapped["Campaign"] = relationship(back_populates="messages")


# ---------------------------------------------------------------------------
# 2. TABELAS DE REFERÊNCIA (semeadas do SRD)
# ---------------------------------------------------------------------------

class GameClass(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    hit_die: Mapped[int] = mapped_column(Integer)
    primary_ability: Mapped[str] = mapped_column(String(80))
    saves: Mapped[str] = mapped_column(String(80))
    asi_levels: Mapped[list] = mapped_column(JSONB, default=list)
    caster_type: Mapped[str | None] = mapped_column(String(20), nullable=True)  # full|half|pact|None

    subclasses: Mapped[list["Subclass"]] = relationship(back_populates="game_class", cascade="all, delete-orphan")
    features: Mapped[list["ClassFeature"]] = relationship(back_populates="game_class", cascade="all, delete-orphan")


class Subclass(Base):
    __tablename__ = "subclasses"
    __table_args__ = (UniqueConstraint("class_id", "name", name="uq_subclass_class_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    source: Mapped[str] = mapped_column(String(80))
    srd: Mapped[bool] = mapped_column(Boolean, default=False)
    blurb: Mapped[str | None] = mapped_column(Text, nullable=True)

    game_class: Mapped["GameClass"] = relationship(back_populates="subclasses")
    features: Mapped[list["SubclassFeature"]] = relationship(back_populates="subclass", cascade="all, delete-orphan")


class ClassFeature(Base):
    __tablename__ = "class_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id", ondelete="CASCADE"), index=True)
    level: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)

    game_class: Mapped["GameClass"] = relationship(back_populates="features")


class SubclassFeature(Base):
    __tablename__ = "subclass_features"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subclass_id: Mapped[int] = mapped_column(ForeignKey("subclasses.id", ondelete="CASCADE"), index=True)
    level: Mapped[int] = mapped_column(Integer, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)

    subclass: Mapped["Subclass"] = relationship(back_populates="features")


class Spell(Base):
    __tablename__ = "spells"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    level: Mapped[int] = mapped_column(Integer, index=True)  # 0 = truque
    school: Mapped[str] = mapped_column(String(40))
    description: Mapped[str] = mapped_column(Text)
    classes: Mapped[list] = mapped_column(JSONB, default=list)  # nomes de classes que podem conjurar


class Feat(Base):
    __tablename__ = "feats"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str] = mapped_column(Text)
