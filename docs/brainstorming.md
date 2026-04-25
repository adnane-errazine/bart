# BART — Art Index Terminal
**Hackathon | Theme: Fintech | Duration: 24h | Team: 5**

---

## 1. The One-Sentence Pitch

> "The Bloomberg Terminal for the art market: an index, analytics, and simulation platform that transforms art — a $65B/year opaque market — into a readable, benchmarkable asset class for institutional finance."

---

## 2. The Problem

Art is the last major alternative asset class that hasn't been financialized.

| Asset Class         | Tradable Indices | Derivatives | ETF              |
|---------------------|-----------------|-------------|------------------|
| Equities ($100T)    | ✅               | ✅           | ✅                |
| Real Estate ($380T) | ✅               | ✅           | ✅                |
| Commodities ($20T)  | ✅               | ✅           | ✅                |
| Crypto ($3T)        | ✅               | ✅           | ✅ (since 2024)   |
| **Art ($65B/year)** | ❌               | ❌           | ❌                |

**Concrete consequences:**
- A family office wanting 5% allocation to art must physically buy artworks
- A fund holding artworks cannot hedge its exposure
- A bank lending against artworks cannot track collateral value in real time
- An asset manager cannot offer art exposure without a 7-year illiquid fund structure

**Existing tools and their limitations:**
- **Artnet** — raw database, not a daily working tool
- **Mei Moses** — static semi-annual publications (acquired by Sotheby's in 2016)
- **ArtTactic** — slow and expensive reports
- **Artprice** — listed company, research-oriented, not trading-grade

None of these are built for PMs, risk managers, or wealth advisors as daily instruments.

---

## 3. The Solution — Four Layers

### Layer 1 — Proprietary Indices
Five sector indices calculated from public auction data:

| Index              | Artists / Scope                      |
|--------------------|--------------------------------------|
| Blue Chip          | Deceased masters: Picasso, Warhol, Monet |
| Modern Masters     | Hockney, Richter                     |
| Ultra-Contemporary | Living artists, post-2010            |
| Photography        | Gursky, Sherman                      |
| Street Art         | Banksy, KAWS                         |

**Methodologies (run in parallel):**
- Repeat-Sales Regression — Case-Shiller / Mei Moses method
- Hedonic Regression — Renneboog-Spaenjers method

### Layer 2 — Trading Desk Simulator
Bloomberg-style interface for:
- Simulating long/short positions across segments
- Backtesting over 5–10 years
- Comparison vs classic benchmarks (S&P 500, Gold, Bitcoin)
- Metrics: P&L, Sharpe ratio, max drawdown, correlations

### Layer 3 — Four AI Agents

| Agent                      | Replaces                    | Time/Cost Saved                     |
|----------------------------|-----------------------------|-------------------------------------|
| Data Enrichment Agent      | Junior analyst research     | 30 min/lot → 5 sec/lot              |
| Anomaly Detection & Insight| Buy-side analyst            | $300K/year equivalent               |
| Portfolio Construction     | Art advisor                 | $5K and 3 weeks → instant           |
| Conversational Research    | Equity research analyst     | Infinite 24/7 query capacity        |

Agent details:
1. **Data Enrichment** — enriches each transaction with context (exhibitions, provenance, press, institutional collections)
2. **Anomaly Detection & Insight** — detects abnormal market moves and explains why the market is moving
3. **Portfolio Construction** — builds a personalized art allocation from the client's existing portfolio
4. **Conversational Research** — chat assistant connected to data + web, answers any question in natural language with generated charts

### Layer 4 — B2B API
Endpoints licensed to:
- Art funds (NAV pricing)
- Private banks (collateral monitoring)
- Insurers (continuous valuation)

---

## 4. Extended Data Architecture (Terminal Metrics)

Beyond basic indices, the terminal exposes granular metrics across four categories:

### 4.1 Liquidity & Secondary Market
- **Time-to-Exit (TTE)** — Average days from listing to transaction for a specific artist
- **Bid-Ask Spread** — Gap between highest bid and lowest ask on fractional shares
- **Secondary Volume Ratio** — % of the work that has changed hands since initial tokenization
- **Holders Concentration** — % held by top 5 investors (manipulation risk signal)

### 4.2 Institutional & Curatorial Validation
- **Museum Acquisition Index (MAI)** — Score based on entry into public collections (MoMA, Tate, etc.)
- **Exhibition DNA** — Granular breakdown:
  - Solo vs. group shows
  - Institution quality (age, budget, influence)
  - Curation-level (directed by a renowned curator?)
- **Grant & Residency History** — List of grants and residencies (Villa Médicis, etc.) acting as "pre-seed" value signals

### 4.3 Production & Scarcity Data
- **Annual Output Rate** — Works produced per year (too many = diluted rarity; too few = lost visibility)
- **Medium Dominance** — Financial performance comparison across paintings, drawings, sculptures
- **Series Coherence** — Score measuring whether a work belongs to a recognized series or is isolated (typically lower value)

### 4.4 Macro & Geopolitical Data
- **Regional Wealth Correlation** — Correlation between artist price and GDP/stock market of their country of origin
- **Art-Equity Correlation** — Performance ratio between artist and S&P 500 / Bitcoin
- **Ancillary Costs** — Real-time dynamic calculation of storage, insurance, and tax costs (droit de suite) by region

---

## 5. Why We're Different

**Our wedge:** We translate the art market into the native language of institutional finance.

No blockchain. No tokenization. No fractionalization. All players who tried those angles (Maecenas, Particle, Artex, Look Lateral) failed — either secondary markets never formed, or token prices diverged violently from realized prices.

**Our intellectual reference: MSCI in the 1970s–80s.** MSCI never traded a single stock. They built the index rail that allowed the entire ETF industry to emerge. We do the same for art.

---

## 6. Business Model

| Tier   | Product          | Price          | Target                                     | TAM          |
|--------|------------------|----------------|--------------------------------------------|--------------|
| Tier 1 | Pro SaaS         | $499/month     | 50,000 family offices and art advisors     | $300M ARR    |
| Tier 2 | Enterprise API   | $5–15K/month   | 200 art funds, private banks, insurers     | $24M ARR     |
| Tier 3 | Index Licensing  | TBD            | ETF sponsors (WisdomTree, Invesco)         | Uncapped     |

**Precedents:**
- Mei Moses acquired by Sotheby's in 2016 for index leadership
- MSCI generates $2.3B annual revenue primarily via ETF index licensing
- Bloomberg Terminal: $24K/month
- PitchBook: $15–30K/year

---

## 7. Competitive Landscape

| Competitor  | What they do                     | Gap vs. us                              |
|-------------|----------------------------------|-----------------------------------------|
| Mei Moses   | Research indices (now Sotheby's) | Static, not trading-grade, no AI        |
| Artprice    | Data publication, listed company | Research-oriented, not actionable       |
| Limna AI    | Individual artwork pricing       | No indices, no portfolio-level view     |
| Wondeur AI  | Career analytics                 | Artist-focused, not investor-focused    |
| Artnet      | Raw database                     | No analytics layer, no agents           |

**Window is open.**

---

## 8. Team Roles & 24h Timeline

### Team Composition
| Role        | Responsibilities                                     |
|-------------|------------------------------------------------------|
| Dev 1       | Backend, data pipeline, index calculation, AI agents |
| Dev 2       | Frontend, Bloomberg-style UX, agent integration      |
| Finance 1   | Pitch, storytelling, market research, deck           |
| Finance 2   | Business model, TAM/SAM/SOM, financial modeling      |
| Jurist      | Compliance, regulatory roadmap (**secret weapon**)   |

### Hour-by-Hour Plan

| Time          | Dev 1                                    | Dev 2                                        | Finance 1                      | Finance 2                      | Jurist                         |
|---------------|------------------------------------------|----------------------------------------------|--------------------------------|--------------------------------|--------------------------------|
| H+0 → H+2    | Generate mocked dataset (500 tx / 10y)   | Setup Next.js + Tailwind + shadcn/ui + Recharts | Market research, precise figures | TAM/SAM/SOM model             | Compliance note drafting       |
| H+2 → H+5    | Repeat-Sales Regression (Python)         | Dark Bloomberg layout                        | Deck v1                        | Willingness-to-pay benchmarks  | Regulatory roadmap             |
| H+5 → H+7    | Hedonic regression                       | Index visualization (multi-line, selectors)  | Deck iteration                 | Business model slide           | Q&A coaching prep              |
| H+7 → H+9    | FastAPI: indices + backtest + chat       | Trade Ticket panel + backtest P&L            | Timed pitch rehearsal          | Yr 1/2/3 projections           | Final validation               |
| H+9 → H+10   | Claude API integration (function calling) | Anomaly Insights panel + UI polish           | Q&A prep                       | Support pitcher                | —                              |
| **H+12→H+16**| **SLEEP — mandatory**                    | **SLEEP — mandatory**                        | **SLEEP (4h min for pitcher)** | **SLEEP — mandatory**          | **SLEEP — mandatory**          |
| H+16 → H+20  | Bug fixing, final integration            | Integration testing                          | Rehearsal + timing             | Financial Q&A responses        | Final validation               |
| H+20 → H+23  | Polish, deploy, dry-run                  | Polish, deploy, dry-run                      | Final pitch run                | Support                        | Technical Q&A support          |
| H+23 → H+24  | **PITCH**                                | **PITCH**                                    | **PITCH**                      | **PITCH**                      | **PRESENT**                    |

---

## 9. Tech Stack

| Layer    | Technology                                              |
|----------|---------------------------------------------------------|
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Recharts |
| Backend  | FastAPI (Python) + statsmodels + scikit-learn           |
| Database | SQLite (dev) or Supabase (prod)                         |
| LLM      | Claude API — Sonnet 4.6 with function calling           |
| Deploy   | Vercel (frontend) + Railway or Render (backend)         |

### Code Ownership (to avoid conflicts)
```
/frontend       → Dev 2
  /components
    /charts     → Dev 2
    /agents     → Dev 2 (UI) + Dev 1 (API)
    /trade      → Dev 2
  /app
    /api        → shared interface contract

/backend        → Dev 1
  /indices      → Dev 1
  /regression   → Dev 1
  /agents       → Dev 1
  /api          → Dev 1 (FastAPI routes)

/data           → Dev 1
  /mock         → generated dataset (CSV/JSON)
  /static       → fallback pre-calculated indices (JSON)
```

**API contract (agreed at H+0):** Frontend calls backend at `localhost:8000/api/v1/`. All routes must be agreed between both devs at the start.

---

## 10. Demo Script (Live Pitch)

1. Open dark dashboard — 5 indices visible
2. Click **Ultra-Contemporary** → 10-year curve appears
3. Read the numbers: *"+247% over 10 years vs +180% S&P. Sharpe 0.8 vs 1.1 for S&P. Volatile but accretive and lowly correlated."*
4. Open **Trade Ticket**: long Ultra-Contemporary, short Old Masters, $1M notional
5. Launch backtest → P&L curve appears
6. Click **"Why is Street Art up?"** → agent generates streaming analysis
7. Type in chat: *"Compare Banksy vs KAWS over 5 years, tell me who's overvalued"* → live response + chart

**Fallback rule:** All indices must be pre-calculated and stored as static JSON in `/data/static/`. If the live backend fails, serve from static files without interruption.

---

## 11. Pitch Structure (3 minutes)

**0:00 → 0:30 — Hook**
"In 2024, the art market moved $65 billion. More than whisky, more than luxury watches. Yet if you manage a family office and your client wants exposure to contemporary art, you have exactly two options: buy a Basquiat for $20M and store it at the Geneva Freeport, or do nothing. No ETF. No index futures. No hedging. Art is the last major asset class that has never been financialized."

**0:30 → 1:00 — Why Now**
Three converging forces: rise of regulated art funds like Masterworks ($1B+ AUM), maturation of LLMs that finally allow signal extraction from fragmented data, growing demand for liquid alternative exposures post-2022.

**1:00 → 2:15 — Live Demo**
(see Demo Script above)

**2:15 → 2:45 — Business Model**
Three immediate revenue streams: SaaS at $500/month (50,000 targets), Enterprise API at $10K/month (Masterworks alone needs this), Index Licensing to ETF sponsors (MSCI model: $2.3B annual revenue).

**2:45 → 3:00 — Close**
"Mei Moses was acquired by Sotheby's in 2016 to capture index leadership. Nobody has built the trading-grade version with an AI agent layer. That's what we're doing. Our team includes a jurist who stress-tested compliance from day one — here's our 24-month regulatory roadmap."

---

## 12. Q&A Preparation

**Q: "How do you monetize if nobody can actually trade these indices?"**
Three immediate revenues already modeled: SaaS analytics, NAV API, data licensing. Tradable instruments come in V2 via ETF sponsor partnership. The data rail is the prerequisite.

**Q: "What are your indices based on?"**
Public auction transactions (~50% of market by value). Two parallel methodologies: repeat-sales regression (Case-Shiller robustness) + hedonic regression (Renneboog-Spaenjers for characteristics). In production: Artnet or Artprice data license (~€3K/year).

**Q: "Why hasn't anyone done this?"**
Mei Moses did research, got acquired. Artprice did publication, went public. Nobody made the step to trading-desk grade: indices + analytics + simulation + pro UX + AI agents. Three conditions changed: LLM maturity, Masterworks as institutional B2B client, post-2022 alternative demand.

**Q: "What about real liquidity to close a long/short?"**
V1 is analytical: synthetic exposure modeling on existing portfolios. V2: OTC derivatives in partnership with a bank — exactly how MSCI started before index futures emerged in the 1980s.

**Q: "Competition?"**
Mei Moses (Sotheby's) and Artprice for data but static research tools. Limna AI for individual pricing, no indices. Wondeur AI for career analytics. Nobody in trading-grade infrastructure with AI agents.

**Q: "Precise TAM?"**
50K family offices × $500/month = $300M ARR. 200 art funds/wealth managers × $10K/month = $24M ARR. ETF licensing upside uncapped. Wedge into a market of $65B annual transactions.

---

## 13. Execution Rules

1. **No mention of blockchain or tokenization** in the pitch unless directly asked. Deliberately differentiate from the ocean of empty crypto projects.
2. **Always name 2–3 concrete names** in the pitch (Masterworks, Mei Moses, Sotheby's Financial). Signals domain knowledge.
3. **Always close with a historical analogy** (MSCI, Bloomberg, Liv-ex). Juries remember analogies.
4. **Static fallback for demo** — pre-calculated indices stored as static JSON. Non-negotiable.
5. **Put the jurist on stage** at least once in the pitch. Unique differentiator.
6. **Pitcher: 4h minimum sleep** between H+12 and H+16. Non-negotiable.
7. **Sync every 4h** — 15-minute standups, no more.
8. **API contract defined at H+0** — both devs align on all endpoint signatures before coding.

---

## 14. Immediate Next Steps

- [ ] Whole team validates the angle (30 min)
- [ ] GitHub repo setup + communication channels (15 min)
- [ ] Start 24h timer
- [ ] Dev 1 + Dev 2 agree on API contract (H+0, 30 min session)
- [ ] Dev 1 generates mocked dataset via Claude prompt
- [ ] Dev 2 scaffolds Next.js project with dark Bloomberg theme
- [ ] Finance 1 begins market research sourcing (Art Basel/UBS Art Market Report 2025)
- [ ] Finance 2 starts TAM model
- [ ] Jurist drafts compliance note + demo disclaimer
