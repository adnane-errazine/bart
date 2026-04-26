"""
Tools exposed to Claude via the Anthropic Messages API tool-use schema.
Dispatch is async: search tools try Qdrant semantic search first,
falling back to Dataset keyword search when Qdrant is unavailable.
"""
from __future__ import annotations

import json

import services.rag as rag
from services.dataset import Dataset

# ─── Tool definitions (Anthropic tool-use format) ────────────────────────

TOOL_DEFS = [
    {
        "name": "search_artworks",
        "description": (
            "Semantic search for artworks — matches query against title, artist, style, "
            "description, and creation context. Returns top results with id, artist, title, "
            "year, BART score, and a short description. "
            "Use this as the first step when the user asks about specific artworks or themes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Free-text search (artwork title, theme, style, artist name)",
                },
                "category": {
                    "type": "string",
                    "description": (
                        "Optional segment filter: 'Street Art', 'Blue Chip', "
                        "'Modern Masters', 'Ultra-Contemporary', 'Photography'"
                    ),
                },
                "limit": {"type": "integer", "description": "Max results (default 5)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_artists",
        "description": (
            "Semantic search for artists by name or description. "
            "Returns artist profiles with aggregate stats (artwork count, sales count, "
            "avg / median / max price). Use when the user asks about a specific artist "
            "or a group of artists matching certain criteria."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Artist name or descriptive query",
                },
                "limit": {"type": "integer", "description": "Max results (default 5)"},
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_artwork_detail",
        "description": (
            "Retrieve full metadata + complete sale history for an artwork by id. "
            "Use after finding one via search_artworks, or when the user names an id directly."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "artwork_id": {
                    "type": "string",
                    "description": "Artwork id, e.g. 'BNK001'",
                },
            },
            "required": ["artwork_id"],
        },
    },
    {
        "name": "get_recent_sales",
        "description": (
            "List the most recent auction sales, optionally filtered by category, artist, "
            "or artwork. Each sale includes price, estimate range, buyer/seller profiles, "
            "and a narrative `price_change_explanation`. "
            "Use for anomaly analysis or trend questions."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string", "description": "Optional segment filter"},
                "artist_name": {
                    "type": "string",
                    "description": "Optional artist name filter",
                },
                "artwork_id": {
                    "type": "string",
                    "description": "Optional artwork id filter (for repeat-sales analysis)",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max sales to return (default 10)",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_segment_summary",
        "description": (
            "Aggregate statistics for a market segment: sale count, artwork count, "
            "top artists, avg / median / max price, % of sales above estimate. "
            "Use when answering high-level questions about a category."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": (
                        "Segment: 'Street Art', 'Blue Chip', 'Modern Masters', "
                        "'Ultra-Contemporary', 'Photography'"
                    ),
                },
            },
            "required": ["category"],
        },
    },
    {
        "name": "get_index",
        "description": (
            "Quarterly price index for one or all segments. "
            "Value is the median sale price per quarter, normalized to 100 at first observation. "
            "Use for performance questions (e.g. 'how did Street Art perform over 5 years')."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Optional — omit to return all 5 segments",
                },
            },
            "required": [],
        },
    },
]


# ─── Hybrid search helpers ────────────────────────────────────────────────


async def _search_artworks_hybrid(
    ds: Dataset, query: str, category: str | None, limit: int
) -> list[dict]:
    try:
        ids = await rag.search_artworks(query, category, limit)
        if ids:
            artworks = [ds.artworks_by_id[i] for i in ids if i in ds.artworks_by_id]
            if artworks:
                return artworks
    except Exception:
        pass
    # Keyword fallback
    return ds.search_artworks(query, category, limit)


async def _search_artists_hybrid(
    ds: Dataset, query: str, limit: int
) -> list[dict]:
    try:
        ids = await rag.search_artists(query, limit)
        if ids:
            artists = [ds.artists_by_id[i] for i in ids if i in ds.artists_by_id]
            if artists:
                return artists
    except Exception:
        pass
    # Keyword fallback
    return ds.search_artists(query, limit)


# ─── Dispatcher ──────────────────────────────────────────────────────────


async def dispatch_tool(name: str, inputs: dict, ds: Dataset) -> str:
    """Run a tool against the Dataset (+ Qdrant for search) and return JSON."""
    if name == "search_artworks":
        result = await _search_artworks_hybrid(
            ds,
            query=inputs["query"],
            category=inputs.get("category"),
            limit=inputs.get("limit", 5),
        )
        result = [_trim_artwork(a) for a in result]

    elif name == "search_artists":
        result = await _search_artists_hybrid(
            ds,
            query=inputs["query"],
            limit=inputs.get("limit", 5),
        )

    elif name == "get_artwork_detail":
        artwork_id = inputs["artwork_id"]
        artwork = ds.artworks_by_id.get(artwork_id)
        if not artwork:
            result = {"error": f"Artwork '{artwork_id}' not found"}
        else:
            result = {
                "artwork": artwork,
                "sales": [
                    _trim_sale(s)
                    for s in ds.sales_by_artwork.get(artwork_id, [])
                ],
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
