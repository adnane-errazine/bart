from fastapi import APIRouter, HTTPException

from services import dataset

router = APIRouter(tags=["artists"])


@router.get("/artists")
async def list_artists():
    ds = dataset.get()
    return sorted(ds.artists, key=lambda a: -a.get("max_price_eur", 0))


@router.get("/artists/{artist_id}")
async def get_artist(artist_id: str):
    ds = dataset.get()
    artist = ds.artists_by_id.get(artist_id)
    if not artist:
        raise HTTPException(404, f"Artist '{artist_id}' not found")
    return ds.get_artist_summary(artist["name"])
