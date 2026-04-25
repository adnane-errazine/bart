# BART — Developer Setup

Everything a new contributor needs to go from zero to running.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 20.9 | [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20` |
| Python | ≥ 3.11 | via uv (see below) |
| uv | latest | `curl -Lsf https://astral.sh/uv/install.sh \| sh` |
| ngrok | 3.x | `https://ngrok.com/download` → place binary at `/usr/local/bin/ngrok` |
| Vercel CLI | latest | `npm i -g vercel` then `vercel login` |

---

## Environment Variables

Copy the template and fill in your keys:

```bash
cp .env.example .env
```

### `.env` keys

| Key | Where to get it |
|-----|----------------|
| `CLAUDE_API_KEY` | [console.anthropic.com](https://console.anthropic.com) → API Keys |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com) → API Keys |
| `QDRANT_API_KEY` | [cloud.qdrant.io](https://cloud.qdrant.io) → Cluster → API Keys |
| `QDRANT_URL` | Qdrant cluster URL (e.g. `https://<id>.europe-west3-0.gcp.cloud.qdrant.io`) |
| `SUPABASE_URL` | Supabase → Project Settings → Database → **Session pooler** connection string |
| `SUPABASE_PASSWORD` | Supabase → Project Settings → Database → Database Password |
| `NGROK_AUTHTOKEN` | [dashboard.ngrok.com](https://dashboard.ngrok.com) → Your Authtoken |

> **Supabase note**: always use the **Session Pooler** URL (port 5432, host `aws-0-<region>.pooler.supabase.com`), not the direct connection. The direct host is IPv6-only and won't work on WSL2 or most CI environments.

---

## Backend

```bash
cd backend

# Install deps (creates .venv automatically)
uv sync

# Apply schema + seed mock data into Supabase
uv run python seed.py

# Start dev server (port 8000, auto-reload)
uv run uvicorn main:app --reload --port 8000
```

API is live at `http://localhost:8000`. OpenAPI docs at `http://localhost:8000/docs`.

### Public tunnel (optional)

Expose the local backend over the internet for mobile testing or webhooks:

```bash
uv run python -c "
from pyngrok import ngrok, conf
conf.get_default().auth_token = open('../.env').read().split('NGROK_AUTHTOKEN=')[1].split()[0]
conf.get_default().ngrok_path = '/usr/local/bin/ngrok'
t = ngrok.connect(8000, 'http')
print(t.public_url)
input('Press Enter to stop...')
"
```

Or just run the infra-test server in `experiments/infra-test/` which wires ngrok automatically.

---

## Frontend

```bash
cd frontend

# Install deps
npm install

# Dev server (port 3000, hot reload)
npm run dev
```

App at `http://localhost:3000`. The UI uses **mock data by default** — no backend needed to view the UI.

To point it at the local backend, set in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Deploy to Vercel

The frontend is a static Next.js app deployable in one command:

```bash
cd frontend
vercel --prod
```

First time: `vercel login` (authenticates via browser). Vercel auto-detects Next.js — no config needed.

To connect a custom domain or set environment variables, use the Vercel dashboard or:

```bash
vercel env add NEXT_PUBLIC_API_URL
```

---

## Claude Code Plugins

This repo ships with a `.claude/settings.json` that enables the following plugins for Claude Code:

| Plugin | Source | Purpose |
|--------|--------|---------|
| `impeccable` | GitHub: `pbakaus/impeccable` | `/frontend-design` skill — production UI generation |
| `ui-ux-pro-max` | GitHub: `nextlevelbuilder/ui-ux-pro-max-skill` | Design system reference (50+ styles, 161 palettes) |
| `context7` | Official marketplace | Up-to-date library docs |
| `playwright` | Official marketplace | Browser automation / testing |
| `firecrawl` | Official marketplace | Web scraping |
| `vercel` | Official marketplace | Vercel deployment helpers |

Claude Code will prompt you to install any missing plugins when you open the project.

---

## Project Structure (quick reference)

```
bart/
├── backend/         FastAPI + asyncpg + PydanticAI agents
│   ├── main.py      App entry point (lifespan, routers, CORS)
│   ├── db.py        asyncpg connection pool
│   ├── seed.py      Load data/artworks.csv + data/sales.csv into Supabase
│   ├── schema.sql   DB schema (applied on startup and by seed.py)
│   ├── api/v1/      REST routes: artworks, sales, indices, chat
│   └── pyproject.toml
├── frontend/        Next.js 16 + Tailwind
│   ├── app/         App Router pages + layout
│   ├── components/  Sidebar, Topbar, page views
│   ├── lib/         data.ts (mock), utils.ts, api.ts (backend client)
│   └── package.json
├── data/
│   ├── artworks.csv 2 seed artworks (Banksy, Picasso)
│   └── sales.csv    7 seed sales records
├── experiments/     Throwaway spikes — nothing here ships
├── docs/            Architecture, brainstorming, decision records
├── .env             Local secrets — NEVER commit
├── .env.example     Template — commit this
└── dev.md           ← you are here
```

---

## Common Issues

**`uv sync` fails with Python version error**
→ uv will auto-download Python 3.12. If it hangs, run `uv python install 3.12` first.

**Supabase connection timeout on WSL2**
→ Ensure `SUPABASE_URL` uses the session pooler URL, not the direct host.

**ngrok ERR_NGROK_108 (too many sessions)**
→ `pkill -f ngrok` to kill stale sessions, then restart.

**`npm run build` fails with Node version error**
→ `nvm use 20` (or 24) before building/deploying.

**Vercel not linked**
→ Run `vercel link` inside `frontend/` and select your project.
