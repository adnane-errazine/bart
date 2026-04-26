# Handoff

> Overwrite this file at end of session — don't append a wall.
> Read this + `git log --oneline -20` at start of every session.

**Last touched:** Rémi · 2026-04-26

---

## Just done — dashboard now reads from the real CSV data

### Backend
- `services/dataset.py` extended with aggregation helpers: `get_top_constituents`, `get_index_summary`, `get_artist_summary`, `get_artwork_aggregates`. Loads `data/enrichments.json` at startup.
- New routes: `GET /api/v1/indices/summary` (rich per-segment summary), `GET /api/v1/artists`, `GET /api/v1/artists/{id}`, `GET /api/v1/artworks/{id}/enrichment`. Existing `GET /api/v1/artworks/{id}` now returns aggregates inline (fair_value, confidence, liquidity, last_sale, five_y_return).
- Volatility computation clipped at ±35% per quarter to neutralize the BNK001 21M€ outlier (otherwise Street Art vol = 99%).

### Hero enrichments
- `scripts/gen_enrichments.py` — idempotent, calls Claude once per hero artwork. Generates drivers (3 per artwork), story (2-3 paragraphs), score_breakdown (BART/Confidence/Liquidity), provenance timeline, risk_block, press_highlights.
- Already run for **BNK001** (Banksy *Girl with Balloon → Love is in the Bin*), **PCB002** (Picasso *Femmes d'Alger Version O*), **JDF001** (Jade Fadojutimi *A Vortex of Pillows*). Output in `data/enrichments.json` (~25KB).
- Re-run with `uv run python scripts/gen_enrichments.py [--force] [ID ...]`.

### Frontend
- `lib/api.ts` rewritten with strong types (Artwork, Sale, Artist, ArtistSummary, IndexSummary, Enrichment) and a full client surface.
- `lib/indexMeta.ts` — hardcoded immutable per-segment metadata (name, short, scope, method, desc, confidence) merged with API summaries via `enrichIndices()`.
- `lib/useIndices.ts` — shared React hook for fetching `/indices/summary`.
- `HomePage`, `MarketsPage`, `IndicesPage` now fetch indices from API. Top constituents come from real sale-volume aggregation per segment.
- `ArtworkPage` fetches artwork + sales + enrichment. Story/Score/Drivers tabs use enrichment when present (BNK001/PCB002/JDF001), fall back to CSV metadata otherwise. Sales tab reads real sales with `price_change_explanation` shown inline. Artist name in header is clickable → ArtistPage.
- `ArtistPage` fetches `/artists/{id}` — shows artwork count, sales count, sell-through, over-estimate %, dominant medium, quarterly index chart, tracked corpus (clickable thumbnails), comparable artists in the same segment.
- `WatchlistPage` and `PortfolioPage` (and the Watchlist Pulse panel on Home) updated: WATCHLIST/PORTFOLIO mocks now reference real CSV ids (BNK001, PCB002, JDF001, WAR001, GRS001, BSQ002, HCK001, KWS001) and inline title/artist/segment so any click navigates to a real ArtworkPage.

### Pages still purely mock-based (no equivalent in CSV — fine for the demo)
- `SignalsPage`, `GalleriesPage`, `MovementsPage`, `ReportsPage` — visual filler.
- The "Daily Brief", "Top Movers", "Upcoming Auctions", "Latest Auction Results" panels on Home.

## Up next (priority order)

1. **Endpoint `POST /api/v1/anomaly`** — stateless. Takes `{artwork_id?, category?, artist_name?}`, picks the most striking recent move, asks Claude for a 3-5 sentence narrative. Reuses existing tools.
2. **Plug `/anomaly`** into `MarketsPage` (Anomaly Insights panel, click → fetch) and `ArtworkPage` (button "Why did this move?" on the Sales tab — already a candidate next to `price_change_explanation`).
3. **Streaming SSE on `/chat`** — replace blocking POST with EventSource, render token-by-token. Big visual win for the demo.
4. **Audit dead buttons** — `Add to Watchlist`, `Run Valuation`, `Generate Report`, `Contact Expert`, `Export PDF`, `Customize`, etc. Wire to no-ops with toasts at minimum.
5. (Optional) generate enrichments for 1-2 more heroes (WAR001 *Shot Sage Blue Marilyn* would be the obvious 4th).

## Gotchas / hypotheses

- **Hero enrichments only for BNK001 / PCB002 / JDF001.** ArtworkPage shows a graceful fallback for the 997 others (CSV description + style + notable owners). Clicking another work in Watchlist (WAR001, HCK001, etc.) opens a non-enriched fiche — they show the basic story tab and a friendly note on the Drivers tab.
- **Volatility hard-capped at ±35% quarterly.** Without the cap the BNK001 jump throws Street Art vol to 99%+. The number shown is honest under normal returns, slightly understated for the actual repeat-sale jump (which is documented separately on the Sales tab).
- **`change_1d` and `change_7d`** in `IndexSummary` are synthesized from the quarterly delta (divided by 30 and 4.3 respectively). The CSV is quarterly; daily/weekly moves don't really exist in the data. Honest enough for a Bloomberg-style strip.
- **Frontend mock and CSV now share artwork ids.** Don't reintroduce slugs like `bull-quaver-2022` — clicking would 404 the API.
- **Backend lifespan** loads CSVs into memory at startup (~50ms). If you change `data/*.csv` or `data/enrichments.json`, the dev uvicorn reload triggers a re-read on any `*.py` change (touch `main.py` to force).
- **`agents/global_chat.py`** uses a tight system prompt that forbids markdown — chat output is plain paragraphs + entity tokens. If the chat looks visually broken, check that prompt isn't being relaxed.
- `frontend/CLAUDE.md` warns Next.js 16 has breaking changes vs training data — read `node_modules/next/dist/docs/` before non-trivial changes.

## Files touched this session

- `backend/services/dataset.py`, `backend/api/v1/{artworks,artists,indices}.py`, `backend/main.py`
- `data/enrichments.json` (NEW, generated)
- `scripts/gen_enrichments.py` (NEW)
- `frontend/lib/{api,indexMeta,useIndices,data}.ts`
- `frontend/components/pages/{HomePage,MarketsPage,IndicesPage,ArtworkPage,ArtistPage,WatchlistPage,PortfolioPage}.tsx`
