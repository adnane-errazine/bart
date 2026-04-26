# BART — AI Art Market Analytics Terminal

> **Live demo:** [https://frontend-adnane-errazines-projects.vercel.app](https://frontend-adnane-errazines-projects.vercel.app)  
> **Public API:** [https://subramous-priggishly-napoleon.ngrok-free.dev](https://subramous-priggishly-napoleon.ngrok-free.dev)

BART is an AI-powered analytics terminal for the art market.

It brings Bloomberg-style market infrastructure to fine art: segment indices, fair-value analytics, portfolio and watchlist monitoring, streamed AI research, and proactive market signals built on structured auction data.

---

## Overview

The art market is a large, opaque asset class with limited real-time analytics. Investors, advisors, family offices, private banks, art funds, insurers, galleries, and auction professionals still rely heavily on fragmented reports, manual research, and expert intuition.

BART turns artwork metadata and auction sales into a practical decision surface:

- market indices for major art segments
- artwork and artist analytics
- fair-value, confidence, and liquidity metrics
- portfolio and watchlist monitoring
- daily market briefs and proactive signals
- AI research over the dataset

This project was built for the Paris Fintech Hackathon 2026 as an AI-first fintech prototype.

---

## Features

- **Home dashboard** — Daily Brief, top movers, watchlist pulse, upcoming auctions, and latest auction results.
- **Five art market indices** — Street Art, Blue Chip, Modern Masters, Ultra-Contemporary, and Photography.
- **Artwork analytics** — BART Score, fair value, confidence, liquidity, sale history, provenance/story enrichment, and market drivers.
- **Artist analytics** — artist-level sales stats, sell-through, over-estimate rate, tracked corpus, and comparable artists.
- **AI Research chat** — streamed responses, conversation history, semantic/keyword search, and tool-backed dataset answers.
- **Signals feed** — proactive market monitoring with polling, filtering, and dataset-derived impact signals.
- **Watchlist and portfolio views** — monitor tracked works, valuation movement, allocation, concentration, and liquidity.
- **Prototype surfaces** — galleries, movements, reports, and trade simulator screens for the broader product vision.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, TanStack Query, Chart.js, lightweight-charts, lucide-react |
| Backend | FastAPI, Python 3.11+, uv, SQLite, OpenAI, Qdrant, Anthropic |
| Data | CSV auction dataset, enrichment JSON, SQLite conversation DB |
| AI / Search | Claude via Anthropic, OpenAI embeddings, Qdrant vector search, keyword fallback |
| Hosting | Vercel frontend, FastAPI backend exposed through ngrok for demo |

---

## Project Structure

```text
bart/
├── frontend/       Next.js app, terminal UI, API client, page components
├── backend/        FastAPI app, API routes, agents, dataset/search services
├── data/           Artwork CSV, auction sales CSV, enrichments, SQLite DB
├── docs/           Architecture notes, pitch material, flows, handoff notes
├── scripts/        Dataset and enrichment generation scripts
└── experiments/    Prototypes and infra spikes that do not ship directly
```

---

## Environment Variables

`.env.example` is the source of truth for local configuration.

```bash
cp .env.example .env
```

Important variables:

| Variable | Purpose |
|---|---|
| `CLAUDE_API_KEY` | Anthropic/Claude key for AI research and generated analysis |
| `OPENAI_API_KEY` | OpenAI key for embeddings |
| `QDRANT_URL` | Qdrant Cloud cluster URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `NGROK_AUTHTOKEN` | ngrok auth token for exposing the local backend |
| `NEXT_PUBLIC_API_URL` | Backend URL consumed by the Next.js frontend |
| `PUBLIC_NGROK_URL` | Public backend tunnel used for demo deployments |
| `PUBLIC_VERCEL_URL` | Public frontend deployment URL |

If Qdrant is unavailable or empty, the backend keeps running and falls back to keyword search for research queries.

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- API keys listed in `.env.example` for full AI/RAG behavior

### Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- OpenAPI docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```

Frontend URL:

- App: `http://localhost:3000`

---

## Build Guide

### Frontend Production Build

```bash
cd frontend
npm run build
npm run start
```

### Backend Production-Style Run

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

### Optional Qdrant Indexing

Run this when you want semantic search backed by Qdrant instead of keyword-only fallback:

```bash
cd backend
uv run python -m services.indexer
```

---

## Hosting / Deployment

### Frontend on Vercel

```bash
cd frontend
vercel --prod
```

Set this environment variable in Vercel:

```text
NEXT_PUBLIC_API_URL=<public backend URL>
```

Because `NEXT_PUBLIC_API_URL` is read by the frontend at build time, redeploy the frontend whenever the public backend URL changes.

### Backend

Run the FastAPI backend on a reachable server or expose a local instance for demos.

For demo hosting with ngrok:

```bash
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

In another terminal:

```bash
ngrok http 8000
```

After ngrok starts:

1. Update `.env` with the new public backend URL.
2. Update Vercel `NEXT_PUBLIC_API_URL`.
3. Redeploy the frontend if the URL changed.

---

## API Overview

OpenAPI docs are available at:

```text
http://localhost:8000/docs
```

Key routes:

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Backend, dataset, and search health |
| `GET` | `/api/v1/artworks` | List/search artworks |
| `GET` | `/api/v1/artworks/{id}` | Artwork detail with aggregate metrics |
| `GET` | `/api/v1/artworks/{id}/enrichment` | Pre-generated artwork story, drivers, and scoring detail |
| `GET` | `/api/v1/artworks/{id}/sales` | Sales for one artwork |
| `GET` | `/api/v1/sales` | Recent/global sales list |
| `GET` | `/api/v1/artists` | List artists |
| `GET` | `/api/v1/artists/{id}` | Artist summary and tracked works |
| `GET` | `/api/v1/indices` | Segment index history |
| `GET` | `/api/v1/indices/summary` | Rich segment summaries and constituents |
| `GET` | `/api/v1/signals` | Proactive market signals |
| `GET` | `/api/v1/daily-brief` | Home dashboard daily brief |
| `POST` | `/api/v1/chat` | SSE-streamed AI research chat |

---

## Data

The demo dataset is loaded into memory from local files at backend startup.

Current dataset:

- 1,000 artworks
- 1,003 auction sales
- 25 artists
- 5 art market segments

Main files:

- `data/artworks.csv`
- `data/art_auction_dataset.csv`
- `data/enrichments.json`
- `data/bart.db`

The data is hackathon/demo-safe and designed to exercise the product workflows without requiring a live scraping pipeline.

---

## Business Context

BART targets the missing analytics layer for art as a financial asset. The product is designed for investors, advisors, family offices, private banks, art funds, insurers, galleries, and auction houses that need structured pricing, monitoring, and research.

From the project deck: estimated TAM is EUR 7.65B, SAM is EUR 765M, and near-term SOM is EUR 76.5M.

---

## Disclaimer

For informational purposes only. Not investment advice.
