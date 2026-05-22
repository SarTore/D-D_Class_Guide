from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.post("", response_model=schemas.CampaignOut, status_code=201)
def create_campaign(payload: schemas.CampaignCreate, db: Session = Depends(get_db)):
    if not crud.get_character(db, payload.character_id):
        raise HTTPException(404, "Personagem não encontrado")
    return crud.create_campaign(db, payload)


@router.get("/{campaign_id}", response_model=schemas.CampaignOut)
def get_campaign(campaign_id: str, db: Session = Depends(get_db)):
    camp = crud.get_campaign(db, campaign_id)
    if not camp:
        raise HTTPException(404, "Campanha não encontrada")
    return camp


@router.patch("/{campaign_id}", response_model=schemas.CampaignOut)
def update_campaign(campaign_id: str, payload: schemas.CampaignUpdate, db: Session = Depends(get_db)):
    camp = crud.get_campaign(db, campaign_id)
    if not camp:
        raise HTTPException(404, "Campanha não encontrada")
    return crud.update_campaign(db, camp, payload)


# ---- mensagens da campanha ----

@router.get("/{campaign_id}/messages", response_model=list[schemas.MessageOut])
def list_messages(campaign_id: str, db: Session = Depends(get_db)):
    if not crud.get_campaign(db, campaign_id):
        raise HTTPException(404, "Campanha não encontrada")
    return crud.list_messages(db, campaign_id)


@router.post("/{campaign_id}/messages", response_model=schemas.MessageOut, status_code=201)
def add_message(campaign_id: str, payload: schemas.MessageCreate, db: Session = Depends(get_db)):
    if not crud.get_campaign(db, campaign_id):
        raise HTTPException(404, "Campanha não encontrada")
    return crud.add_message(db, campaign_id, payload)
