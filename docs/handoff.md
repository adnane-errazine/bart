# Handoff

> Overwrite this file at end of session — don't append a wall.
> Read this + `git log --oneline -20` at start of every session.

**Last touched:** Marc · 2026-04-26

---

## Just done — portfolio fully derived from holdings + redeployed

### Portfolio refactor
- Bug: removed `PCB002` (Picasso *Femmes d'Alger*) from the holdings list, but the donut and KPIs were hardcoded in `lib/data.ts:PORTFOLIO` so Blue Chip stayed at 76.1% incl. Picasso.
- New hook `frontend/lib/portfolio.ts` — `usePortfolio()`. Holdings live in localStorage (`bart.portfolio.v1`) as `[{id, acquired_eur}]`, default seeded with BNK001 / JDF001 / WAR001 / GRS001 / HCK001. Each holding fetches the real artwork via `api.artwork()` (same approach as `useWatchlist`). All downstream values are derived in-memo: `totals` (totalValue / totalCost / pnl / pnlPct), `allocation` (sorted segment slices with hardcoded segment colors), `averages` (confidence/liquidity from artwork aggregates), `concentration` (single + top-3).
- `PortfolioPage.tsx` rewritten to consume the hook. Donut, KPIs, concentration card, liquidity mix, holdings table all live. Remove button per row. DonutSVG handles 0/1/N slice cases. Adding a holding still routes via the existing "Add holding" button (sends to artwork explorer for now — wire-up TBD).
- `HomePage.tsx` Portfolio Snapshot now uses the same hook (live total, P&L, holding count, conf/liq averages).
- Removed dead `PORTFOLIO` constant from `frontend/lib/data.ts`.

### Deploy
- `vercel --prod` from `frontend/` (project linked, `.vercel/` created). Production URL: **https://frontend-ten-ashy-16.vercel.app** (also reachable at the older `frontend-adnane-errazines-projects.vercel.app` alias). `NEXT_PUBLIC_API_URL` already set in Vercel project env, pointing to the ngrok tunnel.
- Backend untouched — still served via the existing ngrok URL `https://subramous-priggishly-napoleon.ngrok-free.dev`.

## Up next (priority order)

1. **Wire "Add holding"** — currently routes to bare `/artwork`. Should open a search picker, ask for acquired price, then call `add()` from the portfolio hook.
2. Carry priorities from previous handoff (still valid):
   - `POST /api/v1/anomaly` endpoint + plug into MarketsPage and ArtworkPage Sales tab.
   - SSE streaming on `/chat`.
   - Audit dead buttons (`Run Valuation`, `Generate Report`, `Contact Expert`, `Export PDF`, `Customize`, `IFRS 13 export`, `Rebalance`).
   - Optional: enrich WAR001 (*Shot Sage Blue Marilyn*) as a 4th hero.

## Gotchas / hypotheses

- **Portfolio holdings are stored in localStorage**, just like the watchlist. First visit seeds the 5 default holdings. If a user has stale state from a prior version, `bart.portfolio.v1` won't exist yet so they'll get the new defaults.
- **Allocation colors** are keyed by segment string in `SEGMENT_COLORS`. Any new category from the API that isn't in the map renders with a fallback grey.
- The donut self-handles edge cases (empty / single slice). Single slice draws a full circle so the math doesn't blow up.
- `totalCost` and `pnl` now reflect *current* live FV from `/api/v1/artworks/{id}` (`fair_value_mid_eur` falling back to last sale price). If the backend goes down, FV drops to 0 and P&L looks ugly — same fallback pattern as watchlist.
- Carried over: BNK001/PCB002/JDF001 are the only enriched heroes; volatility hard-capped at ±35% quarterly; chat output is plain paragraphs by design.
- `frontend/CLAUDE.md` warns Next.js 16 has breaking changes vs training data — read `node_modules/next/dist/docs/` before non-trivial changes.

## Files touched this session

- `frontend/lib/portfolio.ts` (NEW)
- `frontend/lib/data.ts` (removed `PORTFOLIO` const)
- `frontend/components/pages/PortfolioPage.tsx` (rewritten on top of the hook)
- `frontend/components/pages/HomePage.tsx` (Portfolio Snapshot wired to the hook)
- `docs/handoff.md` (this file)
