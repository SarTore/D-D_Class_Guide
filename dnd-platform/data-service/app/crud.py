"""Operações de banco isoladas das rotas (facilita teste e reuso)."""
from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from . import models, schemas


# ---------------------------- Characters ----------------------------

def create_character(db: Session, data: schemas.CharacterCreate) -> models.Character:
    # by_alias=False já entrega as chaves pelos nomes dos campos (str_, int_),
    # que batem com os atributos do modelo ORM.
    char = models.Character(**data.model_dump(by_alias=False))
    db.add(char)
    db.commit()
    db.refresh(char)
    return char


def get_character(db: Session, character_id: str) -> models.Character | None:
    return db.get(models.Character, character_id)


def list_characters(db: Session, user_id: str) -> list[models.Character]:
    stmt = select(models.Character).where(models.Character.user_id == user_id)
    return list(db.scalars(stmt))


def update_character(db: Session, char: models.Character, data: schemas.CharacterUpdate) -> models.Character:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(char, k, v)
    db.commit()
    db.refresh(char)
    return char


def delete_character(db: Session, char: models.Character) -> None:
    db.delete(char)
    db.commit()


# ---------------------------- Campaigns ----------------------------

def create_campaign(db: Session, data: schemas.CampaignCreate) -> models.Campaign:
    camp = models.Campaign(
        character_id=data.character_id,
        title=data.title,
        tone=data.tone,
        state=data.state.model_dump(),
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return camp


def get_campaign(db: Session, campaign_id: str) -> models.Campaign | None:
    return db.get(models.Campaign, campaign_id)


def update_campaign(db: Session, camp: models.Campaign, data: schemas.CampaignUpdate) -> models.Campaign:
    if data.title is not None:
        camp.title = data.title
    if data.state is not None:
        camp.state = data.state.model_dump()
    db.commit()
    db.refresh(camp)
    return camp


def add_message(db: Session, campaign_id: str, data: schemas.MessageCreate) -> models.Message:
    msg = models.Message(campaign_id=campaign_id, role=data.role, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def list_messages(db: Session, campaign_id: str) -> list[models.Message]:
    stmt = (
        select(models.Message)
        .where(models.Message.campaign_id == campaign_id)
        .order_by(models.Message.created_at)
    )
    return list(db.scalars(stmt))


# ---------------------------- Reference ----------------------------

def get_class(db: Session, name: str) -> models.GameClass | None:
    stmt = (
        select(models.GameClass)
        .where(models.GameClass.name == name)
        .options(
            selectinload(models.GameClass.features),
            selectinload(models.GameClass.subclasses).selectinload(models.Subclass.features),
        )
    )
    return db.scalars(stmt).first()


def list_classes(db: Session) -> list[models.GameClass]:
    return list(db.scalars(select(models.GameClass).order_by(models.GameClass.name)))


def list_spells(db: Session, char_class: str | None = None, level: int | None = None) -> list[models.Spell]:
    stmt = select(models.Spell)
    if level is not None:
        stmt = stmt.where(models.Spell.level == level)
    spells = list(db.scalars(stmt.order_by(models.Spell.level, models.Spell.name)))
    if char_class:
        spells = [s for s in spells if char_class in (s.classes or [])]
    return spells


def list_feats(db: Session) -> list[models.Feat]:
    return list(db.scalars(select(models.Feat).order_by(models.Feat.name)))
