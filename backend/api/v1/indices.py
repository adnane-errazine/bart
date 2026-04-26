from fastapi import APIRouter, Query

from services import dataset

router = APIRouter(tags=["indices"])

CATEGORIES = ["Street Art", "Blue Chip", "Modern Masters", "Photography", "Ultra-Contemporary"]


@router.get("/indices")
async def get_indices(category: str | None = Query(None)):
    """Quarterly median-price index per segment, normalized to 100 at first quarter."""
    ds = dataset.get()
    return ds.get_index(category=category)


@router.get("/indices/summary")
async def get_indices_summary(category: str | None = Query(None)):
    """Rich summary per segment: latest value, multi-period changes, vol, top constituents."""
    ds = dataset.get()
    cats = [category] if category else CATEGORIES
    return [ds.get_index_summary(c) for c in cats if c in ds.sales_by_category]
