"""
Generate narrative enrichments for hero artworks (drivers / story / scoreBreakdown / provenance).

For each hero artwork_id, calls Claude once with the artwork metadata + sales history,
asks for a structured JSON response, and writes to data/enrichments.json.

Idempotent: skips artwork_ids already in the output file unless --force.

Run:
    uv run python scripts/gen_enrichments.py
    uv run python scripts/gen_enrichments.py --force      # regenerate all
    uv run python scripts/gen_enrichments.py BNK001       # only one
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from pathlib import Path

from anthropic import Anthropic
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

ARTWORKS_CSV = ROOT / "data" / "artworks.csv"
SALES_CSV = ROOT / "data" / "art_auction_dataset.csv"
OUT_JSON = ROOT / "data" / "enrichments.json"

HERO_IDS = ["BNK001", "PCB002", "JDF001"]

SYSTEM = """You are an institutional art market analyst writing structured narrative enrichments \
for a Bloomberg-style art terminal. The output is consumed by a UI that renders structured panels — \
return strict JSON only, no markdown, no preamble.

For each artwork you receive, generate factual analyst-grade content. Use real history when the \
artwork is a documented work (Banksy Girl with Balloon, Picasso Femmes d'Alger, etc.). For lesser-\
known works, base the analysis on the sales data provided and your knowledge of the artist's market."""

USER_TEMPLATE = """Generate the enrichment JSON for this artwork.

ARTWORK
{artwork_json}

SALES HISTORY (chronological)
{sales_json}

Return STRICT JSON matching this schema. No prose, no fences, no comments:

{{
  "drivers": [
    {{"num": "01", "title": "...", "text": "...", "impact": "..."}},
    {{"num": "02", "title": "...", "text": "...", "impact": "..."}},
    {{"num": "03", "title": "...", "text": "...", "impact": "..."}}
  ],
  "story": [
    "Paragraphe 1 (3-5 phrases). Style note d'analyste, FR.",
    "Paragraphe 2 (3-5 phrases)."
  ],
  "story_sources": ["Source 1", "Source 2", "Source 3"],
  "score_breakdown": {{
    "bart": {{"provenance": <0-25>, "authentication": <0-20>, "momentum": <0-20>, "validation": <0-20>, "quality": <0-15>}},
    "confidence": {{"depth": <0-30>, "recency": <0-25>, "verification": <0-25>, "observability": <0-20>}},
    "liquidity": {{"frequency": <0-25>, "sell_through": <0-25>, "depth": <0-25>, "exit": <0-25>}}
  }},
  "provenance": [
    {{"year": "YYYY", "type": "museum|foundation|collector|gallery|private", "entity": "...", "detail": "..."}}
  ],
  "risk_block": "Liquidity & risk note (one paragraph, 2-4 sentences).",
  "press_highlights": [
    {{"year": <YYYY>, "outlet": "...", "headline": "..."}}
  ]
}}

Requirements:
- All text in French.
- `drivers`: 3 items, ordered by importance. `impact` is a quantitative claim (e.g. "+28% avg uplift", "+EUR 18M post-2018").
- `story`: 2-3 paragraphs, no markdown, factual.
- `score_breakdown`: integers; sub-totals must be plausible (e.g. provenance 18/25 if Tate-collected).
- `provenance`: 3-6 entries chronologically.
- `risk_block`: institutional tone, mention liquidity score and time-to-exit window.
- `press_highlights`: 2-4 items, real outlets when known.
"""


def load_artworks() -> dict[str, dict]:
    with ARTWORKS_CSV.open() as f:
        return {r["artwork_id"]: r for r in csv.DictReader(f)}


def load_sales_for(artwork_id: str) -> list[dict]:
    sales = []
    with SALES_CSV.open() as f:
        for r in csv.DictReader(f):
            if r["artwork_id"] == artwork_id:
                sales.append({
                    "sale_date": r["sale_date"],
                    "auction_house": r["auction_house"],
                    "sale_price_eur": int(float(r["sale_price_eur"])),
                    "estimate_low_eur": int(float(r["estimate_low_eur"])) if r["estimate_low_eur"] else None,
                    "estimate_high_eur": int(float(r["estimate_high_eur"])) if r["estimate_high_eur"] else None,
                    "buyer_type": r["buyer_type"],
                    "buyer_profile": r["buyer_profile"],
                    "seller_type": r["seller_type"],
                    "seller_profile": r["seller_profile"],
                    "price_change_explanation": r["price_change_explanation"],
                })
    sales.sort(key=lambda s: s["sale_date"])
    return sales


def load_existing() -> dict:
    if OUT_JSON.exists():
        try:
            return json.loads(OUT_JSON.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def write_output(data: dict) -> None:
    OUT_JSON.write_text(json.dumps(data, indent=2, ensure_ascii=False))


def call_claude(artwork: dict, sales: list[dict], client: Anthropic) -> dict:
    user = USER_TEMPLATE.format(
        artwork_json=json.dumps({k: v for k, v in artwork.items() if v}, ensure_ascii=False, indent=2),
        sales_json=json.dumps(sales, ensure_ascii=False, indent=2),
    )
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    raw = next((b.text for b in resp.content if b.type == "text"), "")
    # Strip accidental code fences if Claude added them
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ids", nargs="*", help="Artwork ids to process (default: hero list)")
    parser.add_argument("--force", action="store_true", help="Regenerate even if already in output")
    args = parser.parse_args()

    if not os.environ.get("CLAUDE_API_KEY"):
        sys.exit("CLAUDE_API_KEY not set. Add it to .env at the repo root.")

    target_ids = args.ids or HERO_IDS
    artworks = load_artworks()
    output = load_existing()

    client = Anthropic(api_key=os.environ["CLAUDE_API_KEY"])

    for aid in target_ids:
        if aid not in artworks:
            print(f"⚠ {aid} not found in artworks.csv, skipping")
            continue
        if aid in output and not args.force:
            print(f"✓ {aid} already enriched ({artworks[aid]['title']}), skipping")
            continue

        sales = load_sales_for(aid)
        print(f"→ Generating enrichment for {aid} — {artworks[aid]['title']} ({len(sales)} sales)…")
        try:
            enrichment = call_claude(artworks[aid], sales, client)
            output[aid] = enrichment
            write_output(output)
            print(f"  ✓ Saved")
        except json.JSONDecodeError as e:
            print(f"  ✗ Claude returned invalid JSON: {e}")
        except Exception as e:
            print(f"  ✗ Failed: {type(e).__name__}: {e}")

    print(f"\n✓ Done. {len(output)} enrichment(s) in {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
