import json
import services.embeddings as emb

# Tool definitions in Anthropic tool-use format
TOOL_DEFS = [
    {
        "name": "search_artworks",
        "description": (
            "Semantically search for artworks by style, medium, theme, artist, or any descriptive query. "
            "Returns top matching artworks with metadata including BART score. "
            "Use this as the first step when asked about artworks."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language search query",
                },
                "category": {
                    "type": "string",
                    "description": (
                        "Optional category filter: "
                        "'Street Art', 'Blue Chip', 'Modern Masters', "
                        "'Ultra-Contemporary', or 'Photography'"
                    ),
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "search_artists",
        "description": (
            "Semantically search for artists by name, nationality, movement, or description. "
            "Returns matching artist profiles. Use this when asked about specific artists "
            "or to find artists matching certain characteristics."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Artist name, nationality, movement, or descriptive query",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_artwork_detail",
        "description": (
            "Retrieve full details for a specific artwork: metadata, description, provenance, "
            "and all available auction sale records. Use this after finding an artwork ID "
            "via search_artworks, or when the user refers to a specific artwork by ID."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "artwork_id": {
                    "type": "string",
                    "description": "Artwork ID, e.g. 'BK001'",
                },
            },
            "required": ["artwork_id"],
        },
    },
]


async def _search_artworks(conn, query: str, category: str | None) -> list[dict]:
    try:
        return await emb.search_artworks(query, category)
    except Exception:
        # Postgres full-text fallback when Qdrant is unavailable
        if category:
            rows = await conn.fetch(
                "SELECT id, artist_id, artist_name, category, title, bart_score, description "
                "FROM artwork "
                "WHERE (description ILIKE $1 OR title ILIKE $1 OR artist_name ILIKE $1) "
                "AND category = $2 LIMIT 5",
                f"%{query}%", category,
            )
        else:
            rows = await conn.fetch(
                "SELECT id, artist_id, artist_name, category, title, bart_score, description "
                "FROM artwork "
                "WHERE description ILIKE $1 OR title ILIKE $1 OR artist_name ILIKE $1 "
                "LIMIT 5",
                f"%{query}%",
            )
        return [dict(r) for r in rows]


async def _search_artists(conn, query: str) -> list[dict]:
    try:
        hits = await emb.search_artists(query)
        # Enrich payloads with full DB rows
        ids = [h["id"] for h in hits if "id" in h]
        if ids:
            rows = await conn.fetch(
                "SELECT * FROM artist WHERE id = ANY($1::text[])", ids
            )
            db_by_id = {r["id"]: dict(r) for r in rows}
            return [db_by_id.get(h.get("id"), h) for h in hits]
        return hits
    except Exception:
        rows = await conn.fetch(
            "SELECT * FROM artist WHERE name ILIKE $1 LIMIT 5",
            f"%{query}%",
        )
        return [dict(r) for r in rows]


async def _get_artwork_detail(conn, artwork_id: str) -> dict:
    artwork = await conn.fetchrow("SELECT * FROM artwork WHERE id = $1", artwork_id)
    if not artwork:
        return {"error": f"Artwork '{artwork_id}' not found"}
    sales = await conn.fetch(
        "SELECT * FROM sale WHERE artwork_id = $1 ORDER BY sale_date",
        artwork_id,
    )
    return {
        "artwork": dict(artwork),
        "sales": [dict(s) for s in sales],
    }


async def dispatch_tool(name: str, inputs: dict, conn) -> str:
    if name == "search_artworks":
        result = await _search_artworks(conn, inputs["query"], inputs.get("category"))
    elif name == "search_artists":
        result = await _search_artists(conn, inputs["query"])
    elif name == "get_artwork_detail":
        result = await _get_artwork_detail(conn, inputs["artwork_id"])
    else:
        result = {"error": f"Unknown tool: {name}"}
    return json.dumps(result, default=str)
