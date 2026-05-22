"""
data-service — API de persistência e dados de referência (Python/FastAPI).

Responsabilidades:
  • Dono do banco PostgreSQL (único serviço que fala com o DB)
  • CRUD de personagens, campanhas e mensagens
  • Dados de referência somente leitura (classes, subclasses, magias, talentos)
  • Migrações via Alembic (ver pasta alembic/)

O game-service (Go) consome esta API; ele NÃO acessa o banco diretamente.
"""
from __future__ import annotations

from fastapi import FastAPI

from .routers import campaigns, characters, reference

app = FastAPI(
    title="D&D Platform — Data Service",
    version="0.1.0",
    description="Persistência e dados de referência. Migrações via Alembic.",
)

app.include_router(characters.router)
app.include_router(campaigns.router)
app.include_router(reference.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "data-service"}
