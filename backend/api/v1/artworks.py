from fastapi import APIRouter, Depends, HTTPException
from db import get_db

router = APIRouter(tags=["artworks"])


@router.get("/artworks")
async def list_artworks(conn=Depends(get_db)):
    rows = await conn.fetch(
        "SELECT * FROM artwork ORDER BY bart_score DESC NULLS LAST"
    )
    return [dict(r) for r in rows]


@router.get("/artworks/{artwork_id}")
async def get_artwork(artwork_id: str, conn=Depends(get_db)):
    row = await conn.fetchrow("SELECT * FROM artwork WHERE id = $1", artwork_id)
    if not row:
        raise HTTPException(404, "Artwork not found")
    return dict(row)
