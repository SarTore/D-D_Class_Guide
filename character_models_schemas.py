# =====================================================================
# Referência: model SQLAlchemy + schemas Pydantic do Character,
# alinhados ao que o front (guia de criação) envia/recebe.
#
# NÃO é para colar inteiro por cima dos seus arquivos — use como guia para
# completar o seu app/models.py e app/schemas.py existentes. Não duplique
# colunas/campos que você já tem.
# =====================================================================

# ------------------------- app/models.py ----------------------------
# (trecho do model; mantenha sua Base, mixins de timestamp, etc.)

from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
# from .database import Base


class Character(Base):  # type: ignore  # já existe no seu projeto
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True)
    user_id = Column(String, index=True, nullable=False)

    name = Column(String, nullable=False)
    race = Column(String, nullable=False)
    char_class = Column(String, nullable=False)          # nome da classe (string)
    level = Column(Integer, nullable=False, default=1)
    background = Column(String, nullable=True)            # NOVO p/ o guia
    motivation = Column(String, nullable=True)            # NOVO p/ o guia

    # Atributos. "str" e "int" são palavras reservadas no Postgres, por isso o
    # nome da COLUNA é citado e o atributo Python recebe sufixo "_".
    str_ = Column("str", Integer, nullable=False, default=10)
    dex = Column(Integer, nullable=False, default=10)
    con = Column(Integer, nullable=False, default=10)
    int_ = Column("int", Integer, nullable=False, default=10)
    wis = Column(Integer, nullable=False, default=10)
    cha = Column(Integer, nullable=False, default=10)

    ac = Column(Integer, nullable=False, default=10)      # NOVO (se não existir)
    max_hp = Column(Integer, nullable=False, default=1)   # NOVO (se não existir)

    # Listas — JSONB no Postgres, list[str] na API. (Antes podiam ser strings.)
    skills = Column(JSONB, nullable=False, default=list)
    spells = Column(JSONB, nullable=False, default=list)

    equipment = Column(Text, nullable=True)               # NOVO p/ o guia
    # created_at / updated_at: mantenha seus mixins existentes.


# ------------------------- app/schemas.py ---------------------------
# Pydantic v2.

from pydantic import BaseModel, ConfigDict, Field


class CharacterBase(BaseModel):
    # populate_by_name: aceita tanto "str" (alias) quanto "str_" (nome do campo)
    # na entrada. from_attributes: permite criar a partir do objeto ORM.
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str
    race: str
    char_class: str
    level: int = 1
    background: str | None = None
    motivation: str | None = None

    # Aliases só onde a coluna é palavra reservada; o JSON usa "str"/"int".
    str_: int = Field(default=10, alias="str")
    dex: int = 10
    con: int = 10
    int_: int = Field(default=10, alias="int")
    wis: int = 10
    cha: int = 10

    ac: int = 10
    max_hp: int = 1

    skills: list[str] = Field(default_factory=list)
    spells: list[str] = Field(default_factory=list)
    equipment: str | None = None


class CharacterCreate(CharacterBase):
    user_id: str


class CharacterUpdate(BaseModel):
    # Tudo opcional para PUT/PATCH parcial. (O front manda o objeto completo,
    # então um PUT que reusa CharacterBase também funciona — escolha um.)
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str | None = None
    race: str | None = None
    char_class: str | None = None
    level: int | None = None
    background: str | None = None
    motivation: str | None = None
    str_: int | None = Field(default=None, alias="str")
    dex: int | None = None
    con: int | None = None
    int_: int | None = Field(default=None, alias="int")
    wis: int | None = None
    cha: int | None = None
    ac: int | None = None
    max_hp: int | None = None
    skills: list[str] | None = None
    spells: list[str] | None = None
    equipment: str | None = None


class CharacterOut(CharacterBase):
    id: int
    user_id: str


# Nota de serialização: o FastAPI já serializa a resposta com by_alias=True por
# padrão, então CharacterOut sai com as chaves "str" e "int" (não "str_"/"int_"),
# que é exatamente o que o front lê em fromApi(). Se você desligou isso em algum
# lugar, garanta response_model_by_alias=True na rota de personagens.
