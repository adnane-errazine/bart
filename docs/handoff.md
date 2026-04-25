# Handoff

> One short file shared between devs. **Overwrite** at end of session — do not append a wall.
> Read this + `git log --oneline -20` at start of every session.

**Last touched:** Rémi · 2026-04-26

---

## Just done
- Fixed sidebar overflow: added `min-width: 0` + `overflow-x: auto` on `.main` and `.topbar` in `frontend/app/globals.css:71-72`. Root cause was 1624px horizontal overflow pushing the grid off-screen.
- Aligned on demo strategy: frontend mock (`lib/data.ts`) is the source of truth for visuals; backend reduced to 2 stateless AI endpoints (`/chat` + future `/anomaly`). No Supabase/Qdrant for the demo.
- Created `docs/handoff.md` (this file) + added "Session Protocol" rule to `claude.md`.

## Up next (priority order for whoever picks up)
1. Audit dead buttons across the 13 pages — list which ones do nothing on click.
2. Wire the working ones (navigate, watchlist add/remove, range tabs, segment filters).
3. Build `POST /api/v1/anomaly` — stateless, takes `{artwork_id?, index_id?, context}`, returns Claude narrative. No DB read.
4. Plug `/anomaly` into `MarketsPage` "Anomaly Insights" panel + `ArtworkPage` "Why did this move?" button.
5. Improve Research chat: pass mock data context in system prompt so Claude has something to reason on (current backend has only 2 artworks in DB).

## Gotchas / hypotheses
- **Frontend mock vs backend schema mismatch**: `lib/data.ts` uses IDs like `bull-quaver-2022` and segment `Street & Urban`; backend uses `BK001` / category `Street Art`. Don't try to align — for demo, frontend ignores backend on visual screens.
- Backend CSV has only 2 artworks / 7 sales. Real index calc is impossible — `indices.py` does a naive normalize, not RSR. Don't waste time on RSR for demo.
- `frontend/CLAUDE.md` warns Next.js 16 has breaking changes vs training data → check `node_modules/next/dist/docs/` before non-trivial frontend changes.
- `agents/global_chat.py` uses raw Anthropic SDK (not PydanticAI as `architecture.md` claims). Stick with raw SDK for hackathon — less plumbing.

## Files touched this session
- `frontend/app/globals.css` (overflow fix)
- `docs/handoff.md` (created)
- `claude.md` (added Session Protocol rule)
