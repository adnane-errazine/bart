"""
Tools exposed to Claude via the Anthropic Messages API tool-use schema.
All tool dispatchers operate on the in-memory Dataset (no DB).
"""
from __future__ import annotations

import json

from services.dataset import Dataset

# ─── Tool definitions (Anthropic tool-use format) ────────────────────────

TOOL_DEFS = [
    {
        "name": "search_artworks",
        "description": (
            "Search the auction database for artworks matching a query. "
            "Matches against title, artist name, style, and description. "
            "Returns top results with id, artist, title, year, BART score, and a short description. "
            "Use this as the first step when the user asks about specific artworks or themes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Free-text search (artwork title, theme, style)"},
                "category": {
                    "type": "string",
                    "description": "Optional segment filter: 'Street Art', 'Blue Chip', 'Modern Masters', 'Ultra-Contemporary', 'Photography'",
                },
                "limit": {"type": "integer", "description": "Max results (default 5)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_artists",
        "description": "Search artists by name. Returns artist profiles with aggregate stats (artwork count, sales count, avg/median/max price).",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Artist name (partial match)"},
                "limit": {"type": "integer", "description": "Max results (default 5)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_artwork_detail",
        "description": "Retrieve full metadata + complete sale history for an artwork by id. Use after find one via search_artworks, or when the user names an id directly.",
        "input_schema": {
            "type": "object",
            "properties": {
                "artwork_id": {"type": "string", "description": "Artwork id, e.g. 'BNK001'"},
            },
            "required": ["artwork_id"],
        },
    },
    {
        "name": "get_recent_sales",
        "description": (
            "List the most recent auction sales, optionally filtered by category, artist, or artwork. "
            "Each sale includes its price, estimate range, buyer/seller profiles, and a narrative "
            "`price_change_explanation` describing why the market moved. Use this for anomaly analysis "
            "or trend questions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Optional segment filter"},
                "artist_name": {"type": "string", "description": "Optional artist name filter"},
                "artwork_id": {"type": "string", "description": "Optional artwork id filter (for repeat-sales analysis)"},
                "limit": {"type": "integer", "description": "Max sales to return (default 10)"},
            },
            "required": [],
        },
    },
    {
        "name": "get_segment_summary",
        "description": (
            "Aggregate statistics for a market segment: sale count, artwork count, top artists, "
            "average/median/max price, % of sales above estimate. Use when answering high-level "
            "questions about a category."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Segment: 'Street Art', 'Blue Chip', 'Modern Masters', 'Ultra-Contemporary', 'Photography'",
                },
            },
            "required": ["category"],
        },
    },
    {
        "name": "get_index",
        "description": (
            "Get the quarterly price index for one or all segments. Index value is the median sale "
            "price per quarter, normalized to 100 at the first observation. Use this for performance "
            "questions (e.g. 'how did Street Art perform over the last 5 years')."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Optional — leave empty to return all 5 segments"},
            },
            "required": [],
        },
    },
]


# ─── Dispatcher ──────────────────────────────────────────────────────────


def dispatch_tool(name: str, inputs: dict, ds: Dataset) -> str:
    """Run a tool synchronously against the in-memory Dataset and return JSON."""
    if name == "search_artworks":
        result = ds.search_artworks(
            query=inputs["query"],
            category=inputs.get("category"),
            limit=inputs.get("limit", 5),
        )
        # Trim payload to keep token budget tight
        result = [_trim_artwork(a) for a in result]
    elif name == "search_artists":
        result = ds.search_artists(query=inputs["query"], limit=inputs.get("limit", 5))
    elif name == "get_artwork_detail":
        artwork_id = inputs["artwork_id"]
        artwork = ds.artworks_by_id.get(artwork_id)
        if not artwork:
            result = {"error": f"Artwork '{artwork_id}' not found"}
        else:
            result = {
                "artwork": artwork,
                "sales": [_trim_sale(s) for s in ds.sales_by_artwork.get(artwork_id, [])],
            }
    elif name == "get_recent_sales":
        sales = ds.get_recent_sales(
            category=inputs.get("category"),
            artist_name=inputs.get("artist_name"),
            artwork_id=inputs.get("artwork_id"),
            limit=inputs.get("limit", 10),
        )
        result = [_trim_sale(s) for s in sales]
    elif name == "get_segment_summary":
        result = ds.get_segment_summary(inputs["category"])
    elif name == "get_index":
        result = ds.get_index(category=inputs.get("category"))
    else:
        result = {"error": f"Unknown tool: {name}"}

    return json.dumps(result, default=str, ensure_ascii=False)


# ─── Payload trimming (keep tool results compact) ────────────────────────


def _trim_artwork(a: dict) -> dict:
    return {
        "id": a["id"],
        "artist_id": a["artist_id"],
        "artist_name": a["artist_name"],
        "category": a["category"],
        "title": a["title"],
        "year_created": a["year_created"],
        "medium": a["medium"],
        "bart_score": a["bart_score"],
        "description": (a["description"] or "")[:200],
    }


def _trim_sale(s: dict) -> dict:
    return {
        "id": s["id"],
        "artwork_id": s["artwork_id"],
        "artist_name": s["artist_name"],
        "category": s["category"],
        "sale_date": s["sale_date"],
        "auction_house": s["auction_house"],
        "sale_price_eur": s["sale_price_eur"],
        "estimate_low_eur": s["estimate_low_eur"],
        "estimate_high_eur": s["estimate_high_eur"],
        "sold_above_estimate": s["sold_above_estimate"],
        "price_change_pct": s["price_change_pct"],
        "price_change_explanation": s["price_change_explanation"],
        "buyer_type": s["buyer_type"],
        "buyer_name": s["buyer_name"],
        "seller_type": s["seller_type"],
        "seller_name": s["seller_name"],
        "sale_location": s["sale_location"],
    }
