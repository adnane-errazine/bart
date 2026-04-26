from fastapi import APIRouter, HTTPException, Query

from services import dataset

router = APIRouter(tags=["artworks"])


@router.get("/artworks")
async def list_artworks(
    category: str | None = Query(None),
    artist_name: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    ds = dataset.get()
    pool = ds.artworks
    if category:
        pool = ds.artworks_by_category.get(category, [])
    if artist_name:
        pool = [a for a in pool if a["artist_name"] == artist_name]
    pool = sorted(pool, key=lambda a: -(a["bart_score"] or 0))
    return pool[offset : offset + limit]


@router.get("/artworks/{artwork_id}")
async def get_artwork(artwork_id: str):
    ds = dataset.get()
    artwork = ds.artworks_by_id.get(artwork_id)
    if not artwork:
        raise HTTPException(404, f"Artwork '{artwork_id}' not found")
    aggregates = ds.get_artwork_aggregates(artwork_id)
    return {**artwork, **aggregates}


@router.get("/artworks/{artwork_id}/enrichment")
async def get_artwork_enrichment(artwork_id: str):
    """Pre-generated narrative content (drivers/story/scoreBreakdown). Returns null if not enriched."""
    ds = dataset.get()
    if artwork_id not in ds.artworks_by_id:
        raise HTTPException(404, f"Artwork '{artwork_id}' not found")
    return ds.enrichments.get(artwork_id)
