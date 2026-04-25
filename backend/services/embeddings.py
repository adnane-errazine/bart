import os
import hashlib
from openai import AsyncOpenAI
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue,
)

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
        )
    return _qdrant


def str_to_qdrant_id(s: str) -> int:
    # Qdrant requires integer or UUID ids; hash the string id deterministically.
    return int.from_bytes(hashlib.sha1(s.encode()).digest()[:8], "big") >> 1


async def embed(text: str) -> list[float]:
    r = await get_openai().embeddings.create(model="text-embedding-3-small", input=text)
    return r.data[0].embedding


async def ensure_collections() -> None:
    qdrant = get_qdrant()
    for name in ("artworks", "artists"):
        if not await qdrant.collection_exists(name):
            await qdrant.create_collection(
                name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )


async def upsert_artwork(artwork_id: str, text: str, payload: dict) -> None:
    vec = await embed(text)
    await get_qdrant().upsert(
        "artworks",
        points=[PointStruct(
            id=str_to_qdrant_id(artwork_id),
            vector=vec,
            payload={"id": artwork_id, **payload},
        )],
    )


async def upsert_artist(artist_id: str, text: str, payload: dict) -> None:
    vec = await embed(text)
    await get_qdrant().upsert(
        "artists",
        points=[PointStruct(
            id=str_to_qdrant_id(artist_id),
            vector=vec,
            payload={"id": artist_id, **payload},
        )],
    )


async def search_artworks(query: str, category: str | None = None, n: int = 5) -> list[dict]:
    vec = await embed(query)
    filt = None
    if category:
        filt = Filter(must=[FieldCondition(key="category", match=MatchValue(value=category))])
    hits = await get_qdrant().search("artworks", query_vector=vec, limit=n, query_filter=filt)
    return [h.payload for h in hits]


async def search_artists(query: str, n: int = 5) -> list[dict]:
    vec = await embed(query)
    hits = await get_qdrant().search("artists", query_vector=vec, limit=n)
    return [h.payload for h in hits]
