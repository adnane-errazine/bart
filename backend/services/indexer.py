"""
Offline indexer — embed all artworks and artists into Qdrant.

Run once (or after CSV changes):
    python -m services.indexer

Re-index even if vectors exist:
    python -m services.indexer --force
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

import services.rag as rag
from services.dataset import Dataset


async def run(force: bool = False) -> None:
    ds = Dataset.load()
    print(f"Dataset: {len(ds.artworks)} artworks, {len(ds.artists)} artists")

    await rag.ensure_collections()

    indexed = await rag.artworks_indexed()
    if indexed >= len(ds.artworks) and not force:
        print(
            f"Qdrant already has {indexed} vectors — nothing to do. "
            "Pass --force to re-index."
        )
        return

    # ── Artworks ──────────────────────────────────────────────────────────
    print(f"Embedding {len(ds.artworks)} artworks...")
    for i, a in enumerate(ds.artworks):
        text = " ".join(
            filter(
                None,
                [
                    a["title"],
                    a["artist_name"],
                    a["description"],
                    a["artwork_style"],
                    a["creation_context"],
                    a["medium"],
                ],
            )
        )
        await rag.upsert_artwork(
            a["id"],
            text,
            {
                "artist_id": a["artist_id"],
                "artist_name": a["artist_name"],
                "category": a["category"],
                "title": a["title"],
                "bart_score": a["bart_score"],
            },
        )
        if (i + 1) % 100 == 0:
            print(f"  {i + 1}/{len(ds.artworks)}")
    print(f"✓ {len(ds.artworks)} artworks indexed")

    # ── Artists ───────────────────────────────────────────────────────────
    print(f"Embedding {len(ds.artists)} artists...")
    for a in ds.artists:
        text = f"{a['name']} {a.get('category', '')}"
        await rag.upsert_artist(
            a["id"],
            text,
            {"name": a["name"], "category": a.get("category", "")},
        )
    print(f"✓ {len(ds.artists)} artists indexed")
    print("Done.")


if __name__ == "__main__":
    asyncio.run(run(force="--force" in sys.argv))
