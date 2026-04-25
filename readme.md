# BART — Art Index Terminal

> The Bloomberg Terminal for the art market.

BART turns a $65B/year opaque asset class into a readable, benchmarkable market for institutional finance — with proprietary indices, a trading desk simulator, and four AI agents.

---

## What It Does

| Layer | Description |
|---|---|
| **Indices** | 5 real-time sector indices built on public auction data (Blue Chip, Modern Masters, Ultra-Contemporary, Photography, Street Art) |
| **Trading Desk** | Simulate long/short positions, run backtests, compare vs S&P 500 / Gold / Bitcoin |
| **AI Agents** | Data enrichment, anomaly detection, portfolio construction, conversational research |
| **B2B API** | Licensed endpoints for art funds (NAV pricing), private banks (collateral), insurers (valuation) |

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) · Tailwind CSS · shadcn/ui · Recharts |
| Backend | FastAPI · Python · statsmodels · scikit-learn |
| AI | Claude API — Sonnet 4.6 with function calling |
| Database | SQLite (dev) · Supabase (prod) |
| Deploy | Vercel (frontend) · Railway (backend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- An Anthropic API key

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # add your API base URL
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # add your Anthropic API key
uvicorn main:app --reload
```

The API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

---

## Project Structure

```
bart/
├── frontend/        ← Next.js app
├── backend/         ← FastAPI + index calculation + agents
├── data/
│   ├── mock/        ← generated auction dataset
│   └── static/      ← pre-calculated index JSON (demo fallback)
├── agents/          ← AI agent prompts and logic
├── deployment/
│   └── web/         ← Vercel + Railway config
└── docs/
    ├── brainstorming.md   ← full product brief
    └── architecture.md    ← living architecture reference
```

---

## Index Methodology

Two methodologies run in parallel for robustness:

- **Repeat-Sales Regression** — tracks price changes for the same work across sales (Case-Shiller / Mei Moses method)
- **Hedonic Regression** — controls for artwork characteristics to isolate price trends (Renneboog-Spaenjers method)

Data source: public auction records (~50% of total art market by value).

---

## Demo Fallback

`data/static/` contains pre-calculated index files. The frontend can run entirely from these with no backend — used as a safety net during live demos. Do not delete or modify these files manually.

---

## Disclaimer

*For informational purposes only. Not investment advice.*
