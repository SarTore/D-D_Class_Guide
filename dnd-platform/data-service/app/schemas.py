"""
Schemas Pydantic v2 — contratos de entrada/saída da API.
Separados dos modelos ORM de propósito: a API nunca expõe o ORM direto.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Atributos reutilizáveis
# ---------------------------------------------------------------------------

class AbilityScores(BaseModel):
    str_: int = Field(10, alias="str", ge=1, le=30)
    dex: int = Field(10, ge=1, le=30)
    con: int = Field(10, ge=1, le=30)
    int_: int = Field(10, alias="int", ge=1, le=30)
    wis: int = Field(10, ge=1, le=30)
    cha: int = Field(10, ge=1, le=30)

    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# Character
# ---------------------------------------------------------------------------

class CharacterBase(BaseModel):
    name: str = Field(..., max_length=120)
    race: str
    char_class: str
    subclass: Optional[str] = None
    level: int = Field(1, ge=1, le=20)
    background: Optional[str] = None
    motivation: Optional[str] = None

    str_: int = Field(10, alias="str")
    dex: int = 10
    con: int = 10
    int_: int = Field(10, alias="int")
    wis: int = 10
    cha: int = 10

    ac: int = 10
    max_hp: int = 1

    skills: list[str] = Field(default_factory=list)
    spells: list[str] = Field(default_factory=list)
    feats: list[str] = Field(default_factory=list)
    equipment: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class CharacterCreate(CharacterBase):
    user_id: str


class CharacterUpdate(BaseModel):
    # Tudo opcional para PATCH parcial
    name: Optional[str] = None
    subclass: Optional[str] = None
    level: Optional[int] = Field(None, ge=1, le=20)
    motivation: Optional[str] = None
    ac: Optional[int] = None
    max_hp: Optional[int] = None
    skills: Optional[list[str]] = None
    spells: Optional[list[str]] = None
    feats: Optional[list[str]] = None
    equipment: Optional[str] = None


class CharacterOut(CharacterBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# ---------------------------------------------------------------------------
# Campaign + Message
# ---------------------------------------------------------------------------

class CampaignState(BaseModel):
    hp: int = 0
    gold: int = 0
    inspiration: bool = False
    conditions: str = ""
    location: str = ""
    inventory: str = ""
    xp: int = 0
    quests: str = ""
    spell_slots: list[dict] = Field(default_factory=list)


class CampaignCreate(BaseModel):
    character_id: str
    title: str = "Campanha sem título"
    tone: str = "heroico"
    state: CampaignState = Field(default_factory=CampaignState)


class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    state: Optional[CampaignState] = None


class CampaignOut(BaseModel):
    id: str
    character_id: str
    title: str
    tone: str
    state: dict
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageCreate(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class MessageOut(BaseModel):
    id: str
    campaign_id: str
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Referência (somente leitura)
# ---------------------------------------------------------------------------

class FeatureOut(BaseModel):
    level: int
    name: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class SubclassOut(BaseModel):
    id: int
    name: str
    source: str
    srd: bool
    blurb: Optional[str]
    features: list[FeatureOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ClassOut(BaseModel):
    id: int
    name: str
    hit_die: int
    primary_ability: str
    saves: str
    asi_levels: list[int]
    caster_type: Optional[str]
    subclasses: list[SubclassOut] = Field(default_factory=list)
    features: list[FeatureOut] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class SpellOut(BaseModel):
    id: int
    name: str
    level: int
    school: str
    description: str
    classes: list[str]

    model_config = ConfigDict(from_attributes=True)


class FeatOut(BaseModel):
    id: int
    name: str
    description: str

    model_config = ConfigDict(from_attributes=True)
