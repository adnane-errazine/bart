from fastapi import APIRouter, Depends
from db import get_db

router = APIRouter(tags=["sales"])


@router.get("/artworks/{artwork_id}/sales")
async def list_sales(artwork_id: str, conn=Depends(get_db)):
    rows = await conn.fetch(
        "SELECT * FROM sale WHERE artwork_id = $1 ORDER BY sale_date",
        artwork_id,
    )
    return [dict(r) for r in rows]


@router.get("/sales")
async def all_sales(conn=Depends(get_db)):
    rows = await conn.fetch(
        "SELECT * FROM sale ORDER BY sale_date DESC LIMIT 100"
    )
    return [dict(r) for r in rows]
