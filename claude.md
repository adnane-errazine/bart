# CLAUDE.md — BART

Read this before touching any code.

Full product brief: [docs/brainstorming.md](docs/brainstorming.md)
Living architecture doc: [docs/architecture.md](docs/architecture.md)

---

## What We're Building

Bloomberg Terminal for the art market. Indices + analytics + AI agents. 24h hackathon, 2 devs coding.

---

## Repo Structure

```
bart/
├── frontend/        ← Next.js 14 + Tailwind + shadcn/ui + Recharts
├── backend/         ← FastAPI + Python + statsmodels
├── data/
│   ├── mock/        ← generated dataset
│   └── static/      ← pre-calculated index JSON — DEMO FALLBACK, never delete
├── agents/          ← AI agent prompts and logic
├── deployment/
│   ├── web/         ← Vercel (front) + Railway (back)
│   └── mobile/      ← LOCKED — do not touch unless explicitly told to
├── experiments/     ← throwaway prototypes, UI previews, spikes — nothing here ships
└── docs/
    ├── brainstorming.md
    └── architecture.md   ← update this when you change something structural
```

---

## Rules

**1. Plan first, then code.**
One short paragraph before any non-trivial task: what you're doing, what you're assuming, what could break.

**2. Log structural changes.**
If you add a route, change a schema, add a dependency, or restructure a module — update `docs/architecture.md`. One bullet is enough. Don't skip this.

**3. Mark assumptions in code.**
If you're guessing at something (data shape, API behavior, business logic) — write `# HYPOTHESIS: ...` on that line. Remove it when confirmed.

**4. Protect the demo fallback.**
`data/static/` holds pre-calculated indices for the pitch. If the backend dies during the demo, the frontend must still work from these files. Never delete them. If you change index logic, regenerate them.

**5. API contract — agree once, then freeze.**
Frontend and backend align on all routes at the start. Routes live in `docs/architecture.md`. No unilateral changes. Frontend uses a single API client file, no hardcoded URLs in components.

**6. Keep it simple.**
Minimum code that solves the problem. No abstractions for one-off use. No speculative features. If you write 200 lines and it could be 50, rewrite it.

**7. No blockchain, no tokenization.** Hard rule. Don't introduce it, don't reference it.

**8. Security basics.**
API keys in env vars only. No hardcoded credentials. Every user-facing page shows: *"For informational purposes only. Not investment advice."*

---

## Before You Ship a Task

- [ ] `docs/architecture.md` updated if anything structural changed
- [ ] `data/static/` still valid
- [ ] No hardcoded URLs or credentials
