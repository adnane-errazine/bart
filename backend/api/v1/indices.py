from fastapi import APIRouter, Depends
from db import get_db

router = APIRouter(tags=["indices"])


@router.get("/indices")
async def get_indices(conn=Depends(get_db)):
    """Return per-category price index normalized to 100 at first sale."""
    rows = await conn.fetch(
        """
        SELECT a.category, s.sale_date, s.sale_price_eur
        FROM sale s
        JOIN artwork a ON a.id = s.artwork_id
        ORDER BY a.category, s.sale_date
        """
    )

    by_category: dict[str, list] = {}
    for row in rows:
        cat = row["category"]
        by_category.setdefault(cat, []).append(
            {"date": row["sale_date"].isoformat(), "price": float(row["sale_price_eur"])}
        )

    result: dict[str, list] = {}
    for cat, points in by_category.items():
        base = points[0]["price"]
        result[cat] = [
            {"date": p["date"], "value": round(p["price"] / base * 100, 2)}
            for p in points
        ]

    return result
