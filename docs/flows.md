# BART — Information Flows & User Interactions

---

## 1. Data Ingestion (runs once at startup via `seed.py`)

```
data/artworks.csv
data/sales.csv
        │
        ▼
seed.py
  ├── Parse CSV rows
  ├── For each artwork:
  │     ├── INSERT into Supabase → artworks table
  │     ├── Build embed text:
  │     │     "{title} {artist_name} {description} {artwork_style} {creation_context}"
  │     ├── POST to OpenAI text-embedding-3-small → 1536-dim vector
  │     └── UPSERT into Qdrant collection "artworks"
  │           payload: { category, artist_id, artwork_id }
  │
  ├── For each unique artist:
  │     ├── INSERT into Supabase → artists table
  │     ├── Build embed text: "{name} {movement} {nationality} {bio}"
  │     ├── POST to OpenAI → vector
  │     └── UPSERT into Qdrant collection "artists"
  │
  └── For each sale:
        └── INSERT into Supabase → sales table

Result:
  Supabase  → artworks, artists, sales fully populated
  Qdrant    → artworks + artists searchable by semantic similarity
```

**One-time cost:** ~$0.001 for OpenAI embeddings on 100 artworks. Idempotent — safe to re-run.

**Static fallback:** after seeding, `seed.py` also writes pre-computed index JSON to `data/static/` for demo safety.

---

## 2. Index Calculation Flow (on demand, no stored table)

```
User selects period on chart
        │
        ▼
GET /api/v1/indices?category=street_art&period_months=60
        │
        ▼
index_calc.py
  ├── Fetch all sales WHERE category = 'Street Art'
  │     AND sale_date >= (today - 60 months)
  │     ORDER BY artwork_id, sale_date
  │
  ├── Group by artwork_id
  ├── For each artwork with ≥ 2 sales:
  │     → create a repeat-sale pair (price_t1, price_t2, date_t1, date_t2)
  │
  ├── If pairs < 3: return { error: "insufficient_data" }
  │
  └── Run RSR (statsmodels OLS):
        log(price_t2 / price_t1) ~ time_delta_months
        → produces index series: [(date, index_value), ...]

        ▼
Return sparse list of (date, value) points
Frontend renders as step line (not interpolated)
```

---

## 3. Proactive Agent Flow (background — every 5 min)

```
APScheduler fires every 5 min
        │
        ▼
proactive_agent.run(prompt, deps)
        │
        ▼  Claude Sonnet 4.6 starts reasoning
        │
        ├── tool: get_index("Blue Chip", 12)
        │     → Supabase sales → RSR → returns recent index movement
        │
        ├── tool: get_index("Street Art", 12)
        │     → same
        │
        ├── tool: search_artworks("undervalued artwork recent sale below estimate")
        │     → OpenAI embed query → Qdrant search → returns top 5 matches
        │
        │  Claude reasons: "Street Art up 4.2% this week while sold_above_estimate
        │  rate is 100% for Banksy lots — pre-auction momentum signal"
        │
        └── tool: create_signal(
              title="Street Art momentum signal",
              body="...",
              artwork_id="BK001"
            )
              → INSERT into Supabase signals table

        ▼
Frontend polls GET /api/v1/signals?since=<last_check>&limit=20  (every 30s)
        ▼
ProactiveSignals panel updates — new signal appears with title + body
```

---

## 4. Artwork Chat Flow (scoped to one artwork)

```
User is on /artwork/BK001
User types: "Is this a good entry point?"
        │
        ▼
POST /api/v1/chat/BK001
  body: { conversation_id: "conv_xyz", message: "Is this a good entry point?" }
        │
        ▼
conversation.py
  └── get_history(conv_xyz) → [past messages from Supabase]

        ▼
artwork_chat_agent.run(message, deps, message_history=history)
        │
        ▼  Claude reasons with conversation context
        │
        ├── tool: get_artwork("BK001")
        │     → Supabase SELECT * FROM artworks WHERE id = 'BK001'
        │     → returns full artwork record
        │
        ├── tool: get_sales("BK001")
        │     → Supabase SELECT * FROM sales WHERE artwork_id = 'BK001'
        │     → returns [{date, price, buyer_type, ...}, ...]
        │
        └── tool: search_similar("Banksy street art entry point valuation")
              → OpenAI embed → Qdrant search "artworks" collection
              → returns 5 similar artworks with their metadata

        ▼
Claude generates answer:
  "Based on the 4 recorded sales (€85k → €260k, +206% over 7 years),
   the current trajectory shows consistent above-estimate results.
   The buyer profile (Swiss collector + White Cube) signals institutional
   demand. Comparable Banksy prints in the SA index are +4.2% this month.
   Entry risk: high volatility (±24% drawdown historically)."

        ▼
conversation.py
  └── save_turn(conv_xyz, user_msg, assistant_msg) → Supabase

        ▼
Return { data: { reply: "...", conversation_id: "conv_xyz" } }
Frontend appends message to chat panel
```

---

## 5. Global Chat Flow (RAG over full dataset)

```
User is on terminal dashboard
User types: "Which segment has the best risk-adjusted return?"
        │
        ▼
POST /api/v1/chat
  body: { conversation_id: "global_conv", message: "..." }
        │
        ▼
global_chat_agent.run(message, deps, message_history=history)
        │
        ├── tool: get_index("Blue Chip", 60)
        ├── tool: get_index("Street Art", 60)
        ├── tool: get_index("Ultra-Contemporary", 60)
        │     (Claude calls whichever tools it needs)
        │
        └── tool: search_artworks("risk-adjusted return Sharpe volatility")
              → semantic search across all artworks

        ▼
Claude generates answer with computed Sharpe estimates across segments

        ▼
Save turn → return reply
```

---

## 6. BART Score Flow (on demand, cached)

```
GET /api/v1/artworks/BK001/score
        │
        ├── If artwork.bart_score is not None → return cached value immediately
        │
        └── Else: scoring.py computes all 4 components:
              ├── Price Momentum:    sales from Supabase → compare vs category avg
              ├── Market Actor Quality: buyer_type distribution across sales
              ├── Provenance Signal: sold_above_estimate rate + notable_owners
              └── Liquidity Signal:  sale_count / years_since_creation

              → weighted average → score 0-100
              → UPDATE artworks SET bart_score = X WHERE id = 'BK001'
              → return score + component breakdown
```

---

## 7. What the User Can Do

### Terminal Dashboard (`/`)

| Interaction | What happens |
|---|---|
| **Click a period button** (1Y / 3Y / 5Y / 10Y) | Chart refetches index data for that window, re-renders |
| **Toggle an index** (Blue Chip, Street Art…) | That series shown/hidden on chart |
| **Hover chart** | Crosshair tooltip shows all 5 index values at that date |
| **Click artwork ticker in top bar** | Navigates to `/artwork/{id}` |
| **Select segment in Trade Ticket** | Updates the simulated backtest target |
| **Click LONG / SHORT** | Flips direction of the simulated position |
| **Enter notional + Run Backtest** | Calls index data, runs P&L simulation, shows results |
| **Read Anomaly Insights** | Auto-populated by anomaly agent on load |
| **Type in Global Chat** | Sends to `/chat`, response streams back |
| **Read Proactive Signals** | Live feed polled every 30s from `/signals` |

### Artwork Detail Page (`/artwork/[id]`)

| Interaction | What happens |
|---|---|
| **Page loads** | 5 parallel fetches: artwork, sales, score, artist, artist's other works |
| **Sales History chart** | Step line of sparse sale prices over time (dots = actual sales) |
| **Hover a sale dot** | Tooltip: date, price, auction house, buyer type |
| **BART Score card** | Ring chart + 4 component bars with labels |
| **Click another artwork in "Same Artist" list** | Navigates to that artwork's page |
| **Type in Artwork Chat** | Sends to `/chat/{artwork_id}` — Claude has full sales context |
| **Click buyer/seller in Market Actors** | Filter view to show only that actor's purchases |
| **Back to terminal** | Breadcrumb / back button → `/` |

---

## 8. Frontend Tech Review

### Current plan vs. what we actually need

| Need | Current plan | Verdict |
|---|---|---|
| Routing | Next.js 14 App Router | ✅ Keep — SSR for artwork page is genuinely useful |
| Styling | Tailwind | ✅ Keep — nothing faster |
| Components | shadcn/ui | ✅ Keep — unstyled primitives, easy to theme dark |
| **Main index chart** | Recharts | ⚠️ **Switch to TradingView Lightweight Charts** |
| Sales history (sparse) | Recharts | ⚠️ **Switch to TradingView Lightweight Charts** |
| Simple bar/stat charts | Recharts | ✅ Keep for small charts |
| Server state / fetching | fetch manually | ⚠️ **Add TanStack Query** |
| Global UI state | none | ✅ Fine — no Redux needed |
| Chat streaming | not decided | → Use `fetch` + `ReadableStream` (SSE) |

### Why switch to TradingView Lightweight Charts for the main chart

- Purpose-built for financial time series — handles sparse data, step lines, crosshair natively
- Significantly more performant than Recharts on dense datasets (Canvas vs SVG)
- The "Bloomberg Terminal" aesthetic is closer out of the box
- Free, MIT license, 45kb gzipped
- Our experiment (`ui-preview.html`) already uses Chart.js which proved the concept — Lightweight Charts is the production-grade equivalent

```bash
npm install lightweight-charts   # 45kb, no dependencies
```

### Why add TanStack Query

- Handles loading/error states, caching, background refetching, and the 30s polling for signals — all in one hook
- The proactive signals polling and index refetch on period change are exactly the patterns it's designed for
- Without it, we'll write the same `useEffect` + `useState` boilerplate 10 times

```bash
npm install @tanstack/react-query
```

### Final frontend stack

```
Next.js 14 App Router
Tailwind CSS
shadcn/ui (components)
TradingView Lightweight Charts (main index chart + sales history)
Recharts (BART score bars, simple sparklines)
TanStack Query (all server state + polling)
```
