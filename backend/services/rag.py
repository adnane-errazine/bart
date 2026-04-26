"""
Qdrant semantic search layer.
Uses OpenAI text-embedding-3-small (1536 dims).
Every public function degrades gracefully — callers catch exceptions and
fall back to Dataset keyword search.
"""
from __future__ import annotations

import hashlib
import os

from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PointStruct,
    VectorParams,
)

EMBED_MODEL = "text-embedding-3-small"
VECTOR_DIM = 1536

_openai: AsyncOpenAI | None = None
_qdrant: AsyncQdrantClient | None = None


def get_openai() -> AsyncOpenAI:
    global _openai
    if _openai is None:
        _openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    return _openai


def get_qdrant() -> AsyncQdrantClient:
    global _qdrant
    if _qdrant is None:
        _qdrant = AsyncQdrantClient(
            url=os.environ["QDRANT_URL"],
            api_key=os.environ.get("QDRANT_API_KEY"),
            timeout=30,
            check_compatibility=False,
        )
    return _qdrant


def _str_id(s: str) -> int:
    """Deterministic positive int64 from an arbitrary string (Qdrant ID requirement)."""
    return int.from_bytes(hashlib.sha1(s.encode()).digest()[:8], "big") >> 1


async def embed(text: str) -> list[float]:
    r = await get_openai().embeddings.create(
        model=EMBED_MODEL, input=text[:8000]
    )
    return r.data[0].embedding


async def ensure_collections() -> None:
    qdrant = get_qdrant()
    for name in ("artworks", "artists"):
        if not await qdrant.collection_exists(name):
            await qdrant.create_collection(
                name,
                vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
            )


async def artworks_indexed() -> int:
    info = await get_qdrant().get_collection("artworks")
    return info.points_count or 0


async def upsert_artwork(artwork_id: str, text: str, payload: dict) -> None:
    vec = await embed(text)
    await get_qdrant().upsert(
        "artworks",
        points=[
            PointStruct(
                id=_str_id(artwork_id),
                vector=vec,
                payload={"id": artwork_id, **payload},
            )
        ],
    )


async def upsert_artist(artist_id: str, text: str, payload: dict) -> None:
    vec = await embed(text)
    await get_qdrant().upsert(
        "artists",
        points=[
            PointStruct(
                id=_str_id(artist_id),
                vector=vec,
                payload={"id": artist_id, **payload},
            )
        ],
    )


async def search_artworks(
    query: str, category: str | None = None, n: int = 5
) -> list[str]:
    """Returns ordered list of artwork IDs by semantic similarity."""
    vec = await embed(query)
    filt = (
        Filter(must=[FieldCondition(key="category", match=MatchValue(value=category))])
        if category
        else None
    )
    hits = await get_qdrant().search(
        "artworks", query_vector=vec, limit=n, query_filter=filt
    )
    return [h.payload["id"] for h in hits if "id" in h.payload]


async def search_artists(query: str, n: int = 5) -> list[str]:
    """Returns ordered list of artist IDs by semantic similarity."""
    vec = await embed(query)
    hits = await get_qdrant().search("artists", query_vector=vec, limit=n)
    return [h.payload["id"] for h in hits if "id" in h.payload]
