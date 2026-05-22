from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import crud, schemas
from ..database import get_db

router = APIRouter(prefix="/reference", tags=["reference"])


@router.get("/classes", response_model=list[schemas.ClassOut])
def list_classes(db: Session = Depends(get_db)):
    return crud.list_classes(db)


@router.get("/classes/{name}", response_model=schemas.ClassOut)
def get_class(name: str, db: Session = Depends(get_db)):
    cls = crud.get_class(db, name)
    if not cls:
        raise HTTPException(404, "Classe não encontrada")
    return cls


@router.get("/spells", response_model=list[schemas.SpellOut])
def list_spells(char_class: str | None = None, level: int | None = None, db: Session = Depends(get_db)):
    """Lista magias, opcionalmente filtrando por classe e/ou nível de magia."""
    return crud.list_spells(db, char_class=char_class, level=level)


@router.get("/feats", response_model=list[schemas.FeatOut])
def list_feats(db: Session = Depends(get_db)):
    return crud.list_feats(db)
