from fastapi import APIRouter, Query

from services import dataset

router = APIRouter(tags=["sales"])


@router.get("/artworks/{artwork_id}/sales")
async def list_sales(artwork_id: str):
    ds = dataset.get()
    return ds.sales_by_artwork.get(artwork_id, [])


@router.get("/sales")
async def all_sales(
    category: str | None = Query(None),
    artist_name: str | None = Query(None),
    limit: int = Query(100, ge=1, le=2000),
):
    ds = dataset.get()
    if artist_name:
        pool = ds.sales_by_artist.get(artist_name, [])
    elif category:
        pool = ds.sales_by_category.get(category, [])
    else:
        pool = ds.sales
    return sorted(pool, key=lambda s: s["sale_date"], reverse=True)[:limit]
