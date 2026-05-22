# D&D Platform — backend

Plataforma de aprendizado de D&D 5e (criação de personagem, trilha de
progressão e Mestre por IA) dividida em dois serviços, conforme combinado:

| Serviço          | Linguagem | Papel                                                                 |
|------------------|-----------|-----------------------------------------------------------------------|
| **data-service** | Python (FastAPI) | Dono do banco. CRUD de personagens/campanhas/mensagens + dados de referência (classes, subclasses, magias, talentos). Migrações via **Alembic**. |
| **game-service** | Go        | "O resto": gateway do frontend, rolagem de dados no servidor, turno do Mestre (monta prompt → chama a Anthropic → persiste via data-service). |

```
            ┌────────────┐        HTTP        ┌──────────────┐      SQL      ┌────────────┐
  React ───▶│ game-service│ ─────────────────▶ │ data-service │ ────────────▶ │ PostgreSQL │
  (front)   │   (Go)      │   /characters...    │  (FastAPI)   │   SQLAlchemy  │            │
            │  dados, IA  │ ◀───────────────── │  + Alembic   │ ◀──────────── │            │
            └─────┬───────┘                     └──────────────┘               └────────────┘
                  │
                  ▼
        api.anthropic.com  (chave SÓ no backend)
```

Por que essa divisão resolve as dores do protótipo:
- A **chave da Anthropic** vive só no game-service (Go), nunca no frontend.
- Sai-se do **limite de 5h da assinatura** (erro 429): o backend usa a API
  paga, com limites próprios.
- Persistência real (múltiplas campanhas/personagens) no Postgres.
- Os dados de referência (magias, subclasses, talentos) saem do código e vão
  pro banco — prontos para serem populados pelo SRD.

## Subir tudo (Docker)

```bash
cp .env.example .env          # preencha ANTHROPIC_API_KEY
docker compose up --build
# data-service: http://localhost:8000/docs
# game-service: http://localhost:8080/health
```

O data-service roda `alembic upgrade head` e `python -m app.seed` na subida.

## Rodar sem Docker

**data-service**
```bash
cd data-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://dnd:dnd@localhost:5432/dnd
alembic upgrade head            # cria as tabelas
alembic upgrade head --sql      # (opcional) só imprime o SQL, sem aplicar
python -m app.seed              # popula referência
uvicorn app.main:app --reload   # http://localhost:8000/docs
```

**game-service**
```bash
cd game-service
export DATA_SERVICE_URL=http://localhost:8000
export ANTHROPIC_API_KEY=sk-ant-...
go run .                        # http://localhost:8080
```

## Endpoints principais

data-service (Python):
- `POST /characters`, `GET/PATCH/DELETE /characters/{id}`, `GET /characters?user_id=`
- `POST /campaigns`, `GET/PATCH /campaigns/{id}`
- `GET/POST /campaigns/{id}/messages`
- `GET /reference/classes`, `/reference/classes/{name}`, `/reference/spells?char_class=&level=`, `/reference/feats`

game-service (Go):
- `POST /dice/roll`            → `{ "sides":20, "modifier":5, "mode":"adv" }`
- `POST /campaigns/{id}/turn`  → `{ "content":"eu ataco o goblin" }` → fala do Mestre
- `GET /health`

## Migrações (Alembic)

```bash
# após alterar app/models.py:
alembic revision --autogenerate -m "descrição"
alembic upgrade head
```

A migração inicial (`alembic/versions/0001_initial.py`) está escrita à mão como
base; as próximas saem do autogenerate, que compara os modelos com o banco.

## Próximos passos
- Importador do SRD (Open5e) para popular todas as classes/magias/talentos.
- Endpoint de simulação de combate (modo arena) no game-service.
- Streaming da resposta do Mestre (SSE) e autenticação de usuários.
