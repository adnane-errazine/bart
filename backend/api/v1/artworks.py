from fastapi import APIRouter, HTTPException, Query

from services import dataset

router = APIRouter(tags=["artworks"])


@router.get("/artworks")
async def list_artworks(
    category: str | None = Query(None),
    artist_name: str | None = Query(None),
    q: str | None = Query(None),
    sort_by: str = Query("bart_score", pattern="^(bart_score|year|title|artist|medium)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    ds = dataset.get()
    if q:
        pool = ds.search_artworks(q, category=category, limit=1000)
    elif category:
        pool = ds.artworks_by_category.get(category, [])
    else:
        pool = ds.artworks
    if artist_name:
        pool = [a for a in pool if a["artist_name"] == artist_name]

    descending = sort_dir == "desc"
    if sort_by == "bart_score":
        pool = sorted(
            pool,
            key=lambda a: (
                a["bart_score"] is None,
                -(a["bart_score"] or 0) if descending else (a["bart_score"] or 0),
            ),
        )
    elif sort_by == "year":
        pool = sorted(
            pool,
            key=lambda a: (
                a["year_created"] is None,
                -(a["year_created"] or 0) if descending else (a["year_created"] or 0),
            ),
        )
    elif sort_by == "title":
        pool = sorted(pool, key=lambda a: (a["title"] or "").lower(), reverse=descending)
    elif sort_by == "artist":
        pool = sorted(pool, key=lambda a: (a["artist_name"] or "").lower(), reverse=descending)
    elif sort_by == "medium":
        pool = sorted(pool, key=lambda a: (a["medium"] or "").lower(), reverse=descending)

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
