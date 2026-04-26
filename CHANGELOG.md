# Changelog

## 2026-04-26 08:21:21 CEST

- Improved BART artwork retrieval so exact and fuzzy queries for `Love is in the Bin`, `Love is the Bin`, and related Banksy shredded-balloon phrasing resolve to `BNK001` / `Girl with Balloon`.
- Expanded local artwork search to normalize query text, ignore common stopwords, token-match metadata, and include linked sale `price_change_explanation` narratives.
- Updated hybrid artwork search to prioritize strong local dataset matches before appending Qdrant semantic results.
- Hardened Research Agent entity-token rendering so incomplete `[[artist:...]]` or `[[artwork:...]]` tokens display a fallback label instead of disappearing.
- Verified backend compilation and frontend production build after the changes.

## 2026-04-26 08:26:38 CEST

- Published the frontend production deployment at `https://frontend-adnane-errazines-projects.vercel.app`.
- Confirmed the free ngrok backend tunnel at `https://subramous-priggishly-napoleon.ngrok-free.dev` forwards to local FastAPI on port `8000`.
- Added the public deployment URLs to `.env` and `.env.example`, including `NEXT_PUBLIC_API_URL` for Vercel/Next.js builds.

## 2026-04-26 08:34:42 CEST

- Added artwork-search aliases so `Love is in the Bin`, `Love is the Bin`, and Banksy shredded-balloon phrasing resolve to `BNK001` first in Research Agent tool search.
- Kept the Research Agent `Conversations` panel permanently visible and removed the `Historique` toggle button.
- Restarted the FastAPI backend behind ngrok and redeployed the Vercel production frontend.

## 2026-04-26 08:41:19 CEST

- Added automatic conversation titles from the first user message so the `Conversations` list is easier to scan.
- Enriched `get_artwork_detail` tool responses with sale trajectory analysis: first sale, last sale, max sale, biggest move, price multiple, and total return.
- Filtered noisy zero-result search retries from the Research Agent tool trace when a later tool call succeeds.
- Rebuilt the frontend, restarted the FastAPI backend behind ngrok, and redeployed Vercel production.

## 2026-04-26 09:00:11 CEST

- Fixed the Daily Brief sell-through and dominant-segment logic by deriving above-estimate signals from sale price, estimate high, and price movement when the CSV flag is stale.
- Added stable `id`, `observed_at`, `since`, and `limit` support to `/api/v1/signals` so the Signals surface can behave like a proactive polling feed.
- Updated the Signals page to poll every 30 seconds, merge new signals by id, show last refresh state, and handle offline feed errors.
- Updated the Home Daily Brief to refresh every 30 seconds, show an offline state, and render each bullet as one coherent line inside the existing grid layout.
- Ran backend endpoint checks and a frontend production build; browser testing/deploy verification intentionally left for deployment.
