# BART — Architecture Reference

> Living document. Update when you add a route, change a schema, or make a structural decision.

---

## Stack (confirmed — keys in `.env`)

| Layer        | Choice                              | Env var                              |
|--------------|-------------------------------------|--------------------------------------|
| LLM          | Claude Sonnet 4.6 (Anthropic)       | `CLAUDE_API_KEY`                     |
| Agents       | PydanticAI (Anthropic backend)      | —                                    |
| Embeddings   | OpenAI `text-embedding-3-small`     | `OPENAI_API_KEY`  (1536 dims)        |
| Vector DB    | Qdrant Cloud (GCP `europe-west3`)   | `QDRANT_URL` + `QDRANT_API_KEY`      |
| Relational DB| Supabase (PostgreSQL)               | `SUPABASE_URL`                       |
| Frontend     | Next.js 14 + Tailwind + shadcn      | Vercel (free)                        |
| Backend      | FastAPI (Python)                    | hosting TBD                          |
| Local tunnel | ngrok                               | —                                    |

---

## System Overview

```
Browser (Vercel)
  └── Next.js 14
        │  REST  /api/v1/*
        ▼
FastAPI (Python)
  ├── api/v1/          ← thin HTTP routes
  ├── agents/          ← PydanticAI agents (Claude Sonnet 4.6)
  ├── services/        ← embedding, vector search, scoring, conversation
  └── jobs/            ← APScheduler → proactive sweep every 5 min

Supabase (cloud PostgreSQL)
  └── artworks, artists, sales, signals, conversations, messages

Qdrant Cloud (GCP europe-west3)
  └── collections: artworks, artists

OpenAI API
  └── text-embedding-3-small → 1536-dim vectors → Qdrant

Anthropic API
  └── Claude Sonnet 4.6 → all five agents
```

---

## Data Models

Derived directly from `data/artworks.csv` and `data/sales.csv`.

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
    bart_score: float | None   # computed + cached
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

## Index Calculation

Sales are sparse — no continuous curve per artwork. The index is a **segment-level** construct computed on demand.

```
GET /indices?category=street_art&period_months=60
  1. Fetch all sales for artworks in that category within the window
  2. Run Repeat-Sales Regression (RSR) on sale pairs
     (same artwork sold at least twice = one data point)
  3. Return sparse (date, value) pairs — the frontend renders a step line
```

No index table. Computed per request, cached in-memory for the session.

**Edge case:** if a category has fewer than 3 sale pairs, return `{"error": "insufficient_data"}` and show a placeholder in the UI.

---

## Agent Architecture (PydanticAI + Claude)

### Shared setup

```python
# backend/agents/_base.py
from pydantic_ai import Agent
from pydantic_ai.models.anthropic import AnthropicModel
from dataclasses import dataclass
import asyncpg  # Supabase PostgreSQL

@dataclass
class Deps:
    db: asyncpg.Connection     # Supabase — all relational queries
    qdrant: QdrantClient       # vector search

model = AnthropicModel("claude-sonnet-4-6", api_key=CLAUDE_API_KEY)
```

### The five agents

| Agent | File | Purpose | Tools |
|---|---|---|---|
| `artwork_chat` | `agents/artwork_chat.py` | Chat scoped to one artwork | `get_artwork`, `get_sales`, `search_similar` |
| `global_chat` | `agents/global_chat.py` | RAG over full dataset | `search_artworks`, `search_artists`, `get_index` |
| `anomaly` | `agents/anomaly.py` | Explain a segment movement | `get_index`, `get_recent_sales`, `search_artworks` |
| `enrichment` | `agents/enrichment.py` | Batch-enrich artwork descriptions | `get_artwork`, `update_artwork` |
| `proactive` | `agents/proactive.py` | Background sweep → signals | `search_artworks`, `get_index`, `create_signal` |

### Tool registry

```python
# backend/agents/tools.py
# All tools are plain async functions; registered per-agent with @agent.tool

async def get_artwork(ctx, artwork_id: str) -> dict: ...
async def get_sales(ctx, artwork_id: str) -> list[dict]: ...
async def search_similar(ctx, query: str, n: int = 5) -> list[dict]: ...
    # → embed(query) with OpenAI → Qdrant search → return top-n
async def get_index(ctx, category: str, period_months: int = 60) -> list[dict]: ...
    # → RSR on sales from Supabase
async def create_signal(ctx, title: str, body: str, artwork_id: str | None) -> str: ...
```

---

## Vector Store (Qdrant Cloud)

**Two collections, both with 1536-dim vectors (OpenAI `text-embedding-3-small`).**

```python
# backend/services/embeddings.py
from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient, models

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
qdrant = AsyncQdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)

async def embed(text: str) -> list[float]:
    r = await openai_client.embeddings.create(
        model="text-embedding-3-small", input=text
    )
    return r.data[0].embedding

async def ensure_collections():
    for name in ["artworks", "artists"]:
        if not await qdrant.collection_exists(name):
            await qdrant.create_collection(
                name,
                vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
            )

async def upsert_artwork(artwork: Artwork):
    text = f"{artwork.title} {artwork.artist_name} {artwork.description} {artwork.artwork_style}"
    vec = await embed(text)
    await qdrant.upsert("artworks", points=[
        models.PointStruct(
            id=artwork.id,
            vector=vec,
            payload={"category": artwork.category, "artist_id": artwork.artist_id},
        )
    ])

async def search(collection: str, query: str, n: int = 5, category: str | None = None) -> list[dict]:
    vec = await embed(query)
    filt = models.Filter(must=[models.FieldCondition(
        key="category", match=models.MatchValue(value=category)
    )]) if category else None
    hits = await qdrant.search(collection, query_vector=vec, limit=n, query_filter=filt)
    return [{"id": h.id, "score": h.score, **h.payload} for h in hits]
```

**What gets embedded:**

| Collection | Document text |
|---|---|
| `artworks` | `title + artist_name + description + artwork_style + creation_context` |
| `artists` | `name + movement + nationality + bio` |

Embeddings are generated at seed time (`python seed.py`) and updated when artwork data changes.

---

## Conversation Store (Supabase)

Full message history is fetched and passed to Claude on every turn. No summarization at hackathon scale.

```python
# backend/services/conversation.py

async def get_or_create(db, scope: str, scope_id: str | None) -> str:
    # returns conversation_id
    ...

async def get_history(db, conversation_id: str) -> list[dict]:
    # returns [{"role": "user"|"assistant", "content": "..."}]
    ...

async def save_turn(db, conversation_id: str, user_msg: str, assistant_msg: str):
    ...
```

---

## Proactive Agent (APScheduler — every 5 min)

```python
# backend/jobs/signal_watcher.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

PROMPTS = [
    "Analyze recent art market trends and identify any notable price movements or upcoming auctions.",
    "Look at the current artwork data and flag any artworks that appear undervalued based on sales history.",
]

async def sweep():
    deps = Deps(db=await get_db(), qdrant=get_qdrant())
    for prompt in PROMPTS:
        await proactive_agent.run(prompt, deps=deps)

scheduler = AsyncIOScheduler()
scheduler.add_job(sweep, "interval", minutes=5)
```

Frontend polls `GET /api/v1/signals?since=<iso>&limit=20` every 30s.

---

## BART Score

```
BART Score (0–100) = (
  0.35 × Price Momentum     — artwork price growth vs. its category average
  0.25 × Market Actor Quality — buyer/seller prestige (musée > fondation > collectionneur > galerie)
  0.25 × Provenance Signal  — sold_above_estimate rate + notable_owners mentions of institutions
  0.15 × Liquidity Signal   — sale count / years since creation
)
```

Computed in `backend/services/scoring.py`. All inputs from `Sale` and `Artwork` — no external calls.

---

## API Routes

All prefixed `/api/v1/`. Single client at `frontend/lib/api.ts`.

| Method | Route | Description |
|---|---|---|
| GET | `/artworks` | List — `?category=&artist_id=&limit=&offset=` |
| GET | `/artworks/{id}` | Full artwork detail |
| GET | `/artworks/{id}/sales` | Sale history (sparse points) |
| GET | `/artworks/{id}/score` | BART score + breakdown |
| GET | `/artists/{id}` | Artist profile |
| GET | `/artists/{id}/artworks` | All artworks by artist |
| GET | `/indices` | Segment index — `?category=&period_months=` |
| POST | `/chat` | Global chat `{conversation_id, message}` |
| POST | `/chat/{artwork_id}` | Artwork chat `{conversation_id, message}` |
| GET | `/signals` | Proactive signals `?since=&limit=20` |

All responses: `{"data": ..., "error": null}` or `{"data": null, "error": {"code": "...", "message": "..."}}`.

---

## Environment Variables

```bash
# .env (backend)
CLAUDE_API_KEY=...
OPENAI_API_KEY=...
QDRANT_URL=...
QDRANT_API_KEY=...
SUPABASE_URL=...

# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Folder Structure

```
backend/
├── main.py
├── api/v1/
│   ├── artworks.py
│   ├── artists.py
│   ├── indices.py
│   ├── chat.py
│   └── signals.py
├── models/
│   ├── artwork.py
│   ├── artist.py
│   ├── sale.py
│   ├── signal.py
│   └── conversation.py
├── agents/
│   ├── _base.py             ← Deps, model init
│   ├── tools.py             ← all tool handlers
│   ├── artwork_chat.py
│   ├── global_chat.py
│   ├── anomaly.py
│   ├── enrichment.py
│   └── proactive.py
├── services/
│   ├── embeddings.py        ← OpenAI embed + Qdrant upsert/search
│   ├── conversation.py
│   ├── scoring.py
│   └── index_calc.py        ← RSR computation
├── jobs/
│   └── signal_watcher.py
└── seed.py                  ← loads CSVs → Supabase + embeds → Qdrant

frontend/
├── app/
│   ├── page.tsx             ← terminal dashboard
│   └── artwork/[id]/
│       └── page.tsx
├── components/
│   ├── terminal/
│   ├── artwork/
│   └── agents/
└── lib/
    ├── api.ts
    └── types.ts

data/
├── artworks.csv
├── sales.csv
└── static/                  ← pre-computed index JSON (demo fallback)
```

---

## Open Questions

- [ ] **Streaming**: SSE for chat or wait for full response? SSE is +1h work but much better UX.
- [ ] **Seed data volume**: 2 artworks + 7 sales is not enough for RSR. Need ~100 artworks, ~300 sales. Generate via Claude at H+0.
- [ ] **BART score weights**: validate the 4 components with the finance team.
- [ ] **RSR threshold**: minimum sale pairs needed before falling back to "insufficient data"?
