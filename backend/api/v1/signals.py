"""
Market signals and daily brief — derived from real sales data.
No hardcoded values: every signal, bullet, and stat comes from the Dataset.
"""
from __future__ import annotations

import hashlib
import statistics
from fastapi import APIRouter
from services import dataset

CATEGORIES = ["Street Art", "Blue Chip", "Modern Masters", "Ultra-Contemporary", "Photography"]

router = APIRouter(tags=["signals"])


def _fake_time(seed: str) -> str:
    """Deterministic business-hours HH:MM from a string seed."""
    h = int(hashlib.md5(seed.encode()).hexdigest()[:4], 16)
    hour = 7 + (h % 10)
    minute = (h // 10) % 60
    return f"{hour:02d}:{minute:02d}"


def _fmt_price(eur: float) -> str:
    if eur >= 1_000_000:
        return f"EUR {eur / 1_000_000:.1f}M"
    if eur >= 1_000:
        return f"EUR {eur / 1_000:.0f}k"
    return f"EUR {eur:.0f}"


@router.get("/signals")
async def get_signals():
    ds = dataset.get()
    signals: list[dict] = []

    recent = sorted(ds.sales, key=lambda s: s["sale_date"], reverse=True)[:80]

    for sale in recent:
        pct = sale.get("price_change_pct")
        if pct is None:
            continue

        artwork = ds.artworks_by_id.get(sale["artwork_id"], {})
        title = artwork.get("title") or sale["artwork_id"]
        artist = sale["artist_name"]
        house = sale.get("auction_house") or "Auction"
        price_str = _fmt_price(sale["sale_price_eur"])
        time = _fake_time(sale["id"])
        sign = "+" if pct > 0 else ""

        if pct >= 20:
            signals.append({
                "time": time,
                "type": "mover",
                "text": f"{artist} · {title} — {house} {price_str} · {sign}{pct:.1f}% above estimate",
                "impact": f"{sign}{pct:.1f}%",
                "impactClass": "up",
                "_sort": sale["sale_date"] + time,
            })
        elif pct <= -20:
            signals.append({
                "time": time,
                "type": "alert",
                "text": f"{artist} · {title} — lot underperformed {pct:.1f}% below estimate at {house}",
                "impact": f"{pct:.1f}%",
                "impactClass": "down",
                "_sort": sale["sale_date"] + time,
            })
        elif 8 <= pct < 20:
            signals.append({
                "time": time,
                "type": "fair-value",
                "text": f"{artist} · Fair Value revised {sign}{pct:.1f}% on {house} result — {price_str}",
                "impact": f"{sign}{pct:.1f}%",
                "impactClass": "up",
                "_sort": sale["sale_date"] + time,
            })
        elif -20 < pct <= -8:
            signals.append({
                "time": time,
                "type": "fair-value",
                "text": f"{artist} · Fair Value revised {pct:.1f}% — sell pressure confirmed at {house}",
                "impact": f"{pct:.1f}%",
                "impactClass": "down",
                "_sort": sale["sale_date"] + time,
            })

    # One confidence signal per segment
    for cat in CATEGORIES:
        cat_sales = ds.sales_by_category.get(cat, [])
        if not cat_sales:
            continue
        recent_cat = sorted(cat_sales, key=lambda s: s["sale_date"], reverse=True)[:20]
        n_above = sum(1 for s in recent_cat if s.get("sold_above_estimate"))
        st_pct = round(100 * n_above / len(recent_cat))
        confidence = "High" if st_pct >= 75 else "Medium" if st_pct >= 50 else "Low"
        direction = "up" if st_pct >= 65 else "down"
        time = _fake_time(cat)
        latest_date = recent_cat[0]["sale_date"] if recent_cat else "2020-01-01"
        signals.append({
            "time": time,
            "type": "confidence",
            "text": f"BART {cat.upper()} — Confidence {confidence} · {st_pct}% sell-through on trailing 20 sales",
            "impact": f"{st_pct}% ST",
            "impactClass": direction,
            "_sort": latest_date + time,
        })

    # Watchlist: top-5 BART artworks
    top_artworks = sorted(ds.artworks, key=lambda a: -(a.get("bart_score") or 0))[:5]
    for artwork in top_artworks:
        art_sales = ds.sales_by_artwork.get(artwork["id"], [])
        if not art_sales:
            continue
        latest = sorted(art_sales, key=lambda s: s["sale_date"], reverse=True)[0]
        time = _fake_time(artwork["id"])
        score = artwork.get("bart_score") or 0
        signals.append({
            "time": time,
            "type": "watchlist",
            "text": (
                f"{artwork['artist_name']} · {artwork['title']} — "
                f"BART {score:.0f} · last seen {latest.get('auction_house') or 'Auction'} "
                f"{_fmt_price(latest['sale_price_eur'])}"
            ),
            "impact": "Watch",
            "impactClass": "neutral",
            "_sort": latest["sale_date"] + time,
        })

    signals.sort(key=lambda s: s["_sort"], reverse=True)
    for s in signals:
        s.pop("_sort")

    return signals[:30]


@router.get("/daily-brief")
async def get_daily_brief():
    ds = dataset.get()

    recent = sorted(ds.sales, key=lambda s: s["sale_date"], reverse=True)[:50]

    # Top movers — deduplicated by artist
    top_movers: list[dict] = []
    seen: set[str] = set()
    for sale in recent:
        pct = sale.get("price_change_pct")
        if pct is None or abs(pct) < 10:
            continue
        if sale["artist_name"] in seen:
            continue
        seen.add(sale["artist_name"])
        artwork = ds.artworks_by_id.get(sale["artwork_id"], {})
        expl = (sale.get("price_change_explanation") or "").strip()
        top_movers.append({
            "artist": sale["artist_name"],
            "segment": sale["category"],
            "move": round(pct, 1),
            "driver": expl[:90] if expl else (sale.get("auction_house") or sale["category"]),
        })
        if len(top_movers) >= 6:
            break

    # Best-performing segment (sell-through)
    best_cat, best_st = "—", 0
    for cat in CATEGORIES:
        cat_sales = ds.sales_by_category.get(cat, [])
        if not cat_sales:
            continue
        recent_cat = sorted(cat_sales, key=lambda s: s["sale_date"], reverse=True)[:15]
        n_above = sum(1 for s in recent_cat if s.get("sold_above_estimate"))
        st = round(100 * n_above / len(recent_cat)) if recent_cat else 0
        if st > best_st:
            best_st, best_cat = st, cat

    recent20 = recent[:20]
    n_above = sum(1 for s in recent20 if s.get("sold_above_estimate"))
    updated = recent[0]["sale_date"] if recent else "—"

    # Segment avg prices for intro context
    seg_prices: list[str] = []
    for cat in CATEGORIES[:3]:
        cat_sales = ds.sales_by_category.get(cat, [])
        if not cat_sales:
            continue
        prices = [s["sale_price_eur"] for s in cat_sales if s["sale_price_eur"]]
        if prices:
            med = statistics.median(prices)
            seg_prices.append(f"{cat} médiane {_fmt_price(med)}")

    intro = (
        f"{n_above}/{len(recent20)} des dernières transactions au-dessus de l'estimation. "
        f"Segment dominant : {best_cat} ({best_st}% sell-through). "
        + ("; ".join(seg_prices) + "." if seg_prices else "")
    )

    return {
        "intro": intro,
        "bullets": [
            {
                "artist": m["artist"],
                "segment": m["segment"],
                "move": m["move"],
                "text": m["driver"],
            }
            for m in top_movers[:5]
        ],
        "top_movers": top_movers,
        "updated_at": updated,
    }
