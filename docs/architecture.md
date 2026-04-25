# BART — Architecture Reference

> Living document. Update when you add a route, change a schema, or make a structural decision.

---

## Hackathon Scope (as of 2026-04-25)

**Data ingestion**: Hardcoded structured input — CSV/Excel files preprocessed and seeded into the DB. No automated scraping pipeline.

**Agent focus**: Building the agentic layer on top of already-seeded data. UI will be tuned to actual input fields once data is finalized.

**Key constraint**: System must be demo-ready with incomplete/synthetic data. Agents must degrade gracefully when data is sparse.

---

## Stack

| Layer        | Choice                              | Env var                              | Status |
|--------------|-------------------------------------|--------------------------------------|--------|
| LLM          | Claude Sonnet 4.6 (Anthropic)       | `CLAUDE_API_KEY`                     | ✅ wired |
| Agents       | PydanticAI (Anthropic backend)      | —                                    | 🔲 not built |
| Embeddings   | OpenAI `text-embedding-3-small`     | `OPENAI_API_KEY`  (1536 dims)        | 🔲 not built |
| Vector DB    | Qdrant Cloud (GCP `europe-west3`)   | `QDRANT_URL` + `QDRANT_API_KEY`      | 🔲 not built |
| Relational DB| Supabase (PostgreSQL)               | `SUPABASE_URL`                       | ✅ schema deployed |
| Frontend     | Next.js 16 (App Router)             | Vercel (free)                        | ✅ deployed |
| Backend      | FastAPI (Python)                    | ngrok for local demo                 | ✅ running |

---

## System Overview

```
CSV / Excel files  (data/)
  └── seed.py → Supabase (PostgreSQL) + OpenAI embed → Qdrant

Browser (Vercel)
  └── Next.js 16
        │  REST  /api/v1/*  (ngrok tunnel in demo)
        ▼
FastAPI (Python)
  ├── api/v1/          ← thin HTTP routes
  ├── agents/          ← PydanticAI agents (Claude Sonnet 4.6)
  ├── services/        ← embedding, vector search, scoring, conversation
  └── jobs/            ← APScheduler → proactive sweep

Supabase (cloud PostgreSQL)
  └── artworks, artists, sales, signals, conversations, messages

Qdrant Cloud (GCP europe-west3)
  └── collections: artworks, artists

OpenAI API
  └── text-embedding-3-small → 1536-dim vectors → Qdrant

Anthropic API
  └── Claude Sonnet 4.6 → all agents
```

---

## Data Input

Source files in `data/`:
- `artworks.csv` — artwork metadata, BART score, artist info
- `sales.csv` — auction sale records per artwork

These are preprocessed and loaded via `seed.py` into Supabase and Qdrant. No live scraping in hackathon scope.

CSV column reference:

**artworks.csv**: `artwork_id, artist_name, artist_id, category, title, year_created, medium, dimensions_cm, description, creation_context, artwork_style, notable_owners, bart_score, image_url`

**sales.csv**: `sale_id, artwork_id, artist_name, category, sale_date, auction_house, sale_price_eur, estimate_low_eur, estimate_high_eur, sold_above_estimate, buyer_type, buyer_name, buyer_nationality, seller_type, seller_name, sale_location, source`

---

## Data Models

### Artwork

```python
class Artwork(SQLModel, table=True):
    id: str                    # "BK001"
    artist_id: str             # "ART001"
    artist_name: str
    category: str              # "Street Art" | "Blue Chip" | "Modern Masters"
                               # | "Ultra-Contemporary" | "Photography"
    title: str
    year_created: int
    medium: str
    dimensions_cm: str | None
    description: str           # embedded into Qdrant
    creation_context: str | None
    artwork_style: str | None
    notable_owners: str | None
    bart_score: float | None   # loaded from CSV (pre-computed)
    image_url: str | None
```

### Artist

```python
class Artist(SQLModel, table=True):
    id: str                    # "ART001"
    name: str
    nationality: str | None
    movement: str | None
    bio: str | None            # embedded into Qdrant
```

### Sale

```python
class Sale(SQLModel, table=True):
    id: str                    # "SL001"
    artwork_id: str            # → Artwork.id
    sale_date: date
    auction_house: str
    sale_price_eur: float
    estimate_low_eur: float | None
    estimate_high_eur: float | None
    sold_above_estimate: bool | None
    buyer_type: str            # "Collectionneur" | "Musée" | "Galerie" | "Fondation"
    buyer_name: str | None
    buyer_nationality: str | None
    seller_type: str | None
    seller_name: str | None
    sale_location: str
    source: str | None
```

### Signal

```python
class Signal(SQLModel, table=True):
    id: str
    title: str
    body: str
    artwork_id: str | None
    created_at: datetime
    is_read: bool = False
```

### Conversation + Message

```python
class Conversation(SQLModel, table=True):
    id: str
    scope: str                 # "global" | "artwork"
    scope_id: str | None       # artwork_id when scope = "artwork"
    created_at: datetime

class Message(SQLModel, table=True):
    id: str
    conversation_id: str
    role: str                  # "user" | "assistant"
    content: str
    created_at: datetime
```

---

## Agent Architecture

### Where agents are used

| Page / Feature | Agent | Trigger | Purpose |
|---|---|---|---|
| **Research** page | `global_chat` | User sends message | RAG chat over full artwork + sales dataset |
| **Artwork** detail — chat panel | `artwork_chat` | User sends message | Chat scoped to one artwork (sales history, score, provenance in context) |
| **Markets** page — Anomaly Insights | `anomaly` | Index moves >2% or manual | Explains why an index moved — queries recent sales, returns narrative |
| **Signals** page (data source) | `proactive` | APScheduler every 5 min | Background sweep: finds dislocations, creates signal records |
| Seed time (once) | `enrichment` | `python seed.py` | Enhances descriptions, validates BART scores from CSV data |

**Implementation priority for hackathon:**
1. `global_chat` — powers Research page; most important demo moment
2. `anomaly` — high visual impact, short to implement
3. `proactive` — generates signals passively, good demo effect
4. `artwork_chat` — refinement of global_chat scoped to one item
5. `enrichment` — runs once at seed time (can be a script, not a true agent)

### Shared setup

```python
# backend/agents/_base.py
from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel
from dataclasses import dataclass
import asyncpg

@dataclass
class Deps:
    db: asyncpg.Connection     # Supabase — all relational queries
    qdrant: QdrantClient       # vector search

model = AnthropicModel("claude-sonnet-4-6", api_key=CLAUDE_API_KEY)
```

### Agent definitions

| Agent | File | Tools |
|---|---|---|
| `global_chat` | `agents/global_chat.py` | `search_artworks`, `search_artists`, `get_index`, `get_recent_sales` |
| `artwork_chat` | `agents/artwork_chat.py` | `get_artwork`, `get_sales`, `search_similar` |
| `anomaly` | `agents/anomaly.py` | `get_index`, `get_recent_sales`, `search_artworks` |
| `proactive` | `agents/proactive.py` | `search_artworks`, `get_index`, `create_signal` |
| `enrichment` | `agents/enrichment.py` | `get_artwork`, `update_artwork` |

### Tool registry

```python
# backend/agents/tools.py

async def get_artwork(ctx, artwork_id: str) -> dict: ...
async def get_sales(ctx, artwork_id: str) -> list[dict]: ...
async def get_recent_sales(ctx, category: str, days: int = 90) -> list[dict]: ...
async def search_similar(ctx, query: str, n: int = 5) -> list[dict]: ...
    # → embed(query) → Qdrant search → top-n
async def get_index(ctx, category: str, period_months: int = 60) -> list[dict]: ...
    # → RSR on sales from Supabase
async def search_artworks(ctx, query: str, category: str | None = None, n: int = 5) -> list[dict]: ...
async def search_artists(ctx, query: str, n: int = 5) -> list[dict]: ...
async def create_signal(ctx, title: str, body: str, artwork_id: str | None) -> str: ...
```

---

## Vector Store (Qdrant Cloud)

**Two collections, 1536-dim vectors (OpenAI `text-embedding-3-small`).**

| Collection | Document text embedded |
|---|---|
| `artworks` | `title + artist_name + description + artwork_style + creation_context` |
| `artists` | `name + movement + nationality + bio` |

Embeddings generated at seed time (`python seed.py`). Updated when artwork data changes.

---

## Index Calculation

Sales are sparse — the index is a **segment-level** construct computed on demand.

```
GET /indices?category=street_art&period_months=60
  1. Fetch all sales for artworks in that category within the window
  2. Run Repeat-Sales Regression (RSR) on sale pairs
     (same artwork sold at least twice = one data point)
  3. Return sparse (date, value) pairs
```

No index table. Computed per request, cached in-memory.

**Edge case:** fewer than 3 sale pairs → return `{"error": "insufficient_data"}`.

---

## BART Score

```
BART Score (0–100) = (
  0.35 × Price Momentum     — artwork price growth vs. category average
  0.25 × Market Actor Quality — buyer/seller prestige (musée > fondation > collectionneur > galerie)
  0.25 × Provenance Signal  — sold_above_estimate rate + institutional notable_owners
  0.15 × Liquidity Signal   — sale count / years since creation
)
```

Pre-computed in the CSV for hackathon. Recomputed by `services/scoring.py` on fresh seed.

---

## Conversation Store

Full message history passed to Claude on every turn. No summarization at hackathon scale.

```python
# backend/services/conversation.py
async def get_or_create(db, scope: str, scope_id: str | None) -> str: ...
async def get_history(db, conversation_id: str) -> list[dict]: ...
async def save_turn(db, conversation_id: str, user_msg: str, assistant_msg: str): ...
```

---

## Proactive Agent (APScheduler)

```python
# backend/jobs/signal_watcher.py
PROMPTS = [
    "Analyze recent art market trends and identify notable price movements or upcoming auctions.",
    "Flag artworks that appear undervalued based on sales history and category performance.",
]

async def sweep():
    deps = Deps(db=await get_db(), qdrant=get_qdrant())
    for prompt in PROMPTS:
        await proactive_agent.run(prompt, deps=deps)

scheduler.add_job(sweep, "interval", minutes=5)
```

Frontend polls `GET /api/v1/signals?since=<iso>&limit=20` every 30s.

---

## API Routes

All prefixed `/api/v1/`.

| Method | Route | Description | Status |
|---|---|---|---|
| GET | `/artworks` | List — `?category=&artist_id=&limit=&offset=` | ✅ |
| GET | `/artworks/{id}` | Full artwork detail | ✅ |
| GET | `/artworks/{id}/sales` | Sale history | ✅ |
| GET | `/indices` | Segment index — `?category=&period_months=` | ✅ |
| POST | `/chat` | Global chat `{conversation_id?, message}` | ✅ basic (no tools/memory) |
| POST | `/chat/{artwork_id}` | Artwork-scoped chat | 🔲 not built |
| GET | `/signals` | Proactive signals `?since=&limit=20` | 🔲 not built |
| POST | `/anomaly` | Explain index movement `{category, period_days?}` | 🔲 not built |

---

## Folder Structure

```
backend/
├── main.py
├── schema.sql
├── seed.py                    ← loads CSVs → Supabase + embeds → Qdrant
├── db.py
├── api/v1/
│   ├── artworks.py            ✅
│   ├── sales.py               ✅
│   ├── indices.py             ✅
│   ├── chat.py                ✅ (basic, upgrade to agent)
│   └── signals.py             🔲
├── agents/
│   ├── _base.py               🔲 Deps, model init
│   ├── tools.py               🔲 all tool handlers
│   ├── global_chat.py         🔲
│   ├── artwork_chat.py        🔲
│   ├── anomaly.py             🔲
│   ├── enrichment.py          🔲
│   └── proactive.py           🔲
├── services/
│   ├── embeddings.py          🔲 OpenAI embed + Qdrant upsert/search
│   ├── conversation.py        🔲
│   ├── scoring.py             🔲
│   └── index_calc.py          🔲 RSR computation
└── jobs/
    └── signal_watcher.py      🔲

data/
├── artworks.csv               ✅ (hardcoded input — hackathon)
├── sales.csv                  ✅ (hardcoded input — hackathon)
└── static/                    ← pre-computed fallback JSON

frontend/                      ✅ deployed to Vercel
├── app/page.tsx               ← 13-route SPA (useState routing)
├── components/pages/          ← all 13 pages implemented
└── lib/
    ├── data.ts                ← hardcoded mock data (matches CSV structure)
    └── utils.ts
```

---

## Environment Variables

```bash
# .env (backend root)
CLAUDE_API_KEY=...
OPENAI_API_KEY=...
QDRANT_URL=...
QDRANT_API_KEY=...
SUPABASE_URL=...

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000   # or ngrok URL for demo
```

---

## Open Questions

- [ ] **Streaming**: SSE for chat or wait for full response? SSE is better UX but +1h work.
- [ ] **Conversation memory**: persist per-session (conversation_id in localStorage) or reset on refresh?
- [ ] **RSR threshold**: minimum sale pairs before falling back to "insufficient data"?
- [ ] **Anomaly threshold**: what % move triggers the anomaly agent automatically?
- [ ] **Data volume**: current CSVs have ~10 artworks. Need ~100+ artworks + ~300 sales for meaningful RSR.
