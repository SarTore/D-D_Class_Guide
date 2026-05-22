from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/characters", tags=["characters"])


@router.post("", response_model=schemas.CharacterOut, status_code=201)
def create_character(payload: schemas.CharacterCreate, db: Session = Depends(get_db)):
    return crud.create_character(db, payload)


@router.get("/{character_id}", response_model=schemas.CharacterOut)
def get_character(character_id: str, db: Session = Depends(get_db)):
    char = crud.get_character(db, character_id)
    if not char:
        raise HTTPException(404, "Personagem não encontrado")
    return char


@router.get("", response_model=list[schemas.CharacterOut])
def list_characters(user_id: str, db: Session = Depends(get_db)):
    return crud.list_characters(db, user_id)


@router.patch("/{character_id}", response_model=schemas.CharacterOut)
def update_character(character_id: str, payload: schemas.CharacterUpdate, db: Session = Depends(get_db)):
    char = crud.get_character(db, character_id)
    if not char:
        raise HTTPException(404, "Personagem não encontrado")
    return crud.update_character(db, char, payload)


@router.delete("/{character_id}", status_code=204)
def delete_character(character_id: str, db: Session = Depends(get_db)):
    char = crud.get_character(db, character_id)
    if not char:
        raise HTTPException(404, "Personagem não encontrado")
    crud.delete_character(db, char)
