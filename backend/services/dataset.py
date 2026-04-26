"""
In-memory dataset loaded once at FastAPI startup from the two CSVs in /data.

Exposes a `Dataset` object with pre-built indexes for fast lookup by id,
artist, and category. No DB, no vector store — the demo runs entirely
from RAM.
"""
from __future__ import annotations

import csv
import json
import statistics
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent.parent
ARTWORKS_CSV = ROOT / "data" / "artworks.csv"
SALES_CSV = ROOT / "data" / "art_auction_dataset.csv"
ENRICHMENTS_JSON = ROOT / "data" / "enrichments.json"


def _to_float(s: str) -> float | None:
    s = (s or "").strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _to_int(s: str) -> int | None:
    f = _to_float(s)
    return int(f) if f is not None else None


def _date_diff_months(d1: str, d2: str) -> int:
    """Approximate month difference between two YYYY-MM-DD strings."""
    try:
        y1, m1 = int(d1[:4]), int(d1[5:7])
        y2, m2 = int(d2[:4]), int(d2[5:7])
        return (y1 - y2) * 12 + (m1 - m2)
    except (ValueError, IndexError):
        return 0


_SEARCH_STOPWORDS = {
    "a",
    "about",
    "and",
    "dans",
    "de",
    "des",
    "du",
    "en",
    "est",
    "et",
    "for",
    "in",
    "is",
    "la",
    "le",
    "les",
    "of",
    "on",
    "pour",
    "the",
    "un",
    "une",
    "with",
}

_ARTWORK_SEARCH_ALIASES = {
    "BNK001": [
        "love is in the bin",
        "love is the bin",
        "banksy love is in the bin",
        "banksy love is the bin",
        "shredded balloon girl",
        "shredded girl with balloon",
        "banksy shredded balloon",
        "banksy bin shredded balloon girl",
    ],
}


def _normalize_search_text(text: str) -> str:
    """Case/accent-insensitive text used by lightweight local search."""
    normalized = unicodedata.normalize("NFKD", text or "")
    ascii_text = "".join(c for c in normalized if not unicodedata.combining(c))
    return " ".join(ascii_text.lower().split())


def _query_terms(query: str) -> list[str]:
    normalized = _normalize_search_text(query)
    return [
        term.strip(".,;:!?()[]{}\"'")
        for term in normalized.split()
        if len(term.strip(".,;:!?()[]{}\"'")) >= 3
        and term.strip(".,;:!?()[]{}\"'") not in _SEARCH_STOPWORDS
    ]


def _parse_artwork(row: dict[str, str]) -> dict[str, Any]:
    return {
        "id": row["artwork_id"],
        "artist_id": row["artist_id"],
        "artist_name": row["artist_name"],
        "category": row["category"],
        "title": row["title"],
        "year_created": _to_int(row.get("year_created", "")),
        "medium": row.get("medium") or None,
        "dimensions_cm": row.get("dimensions_cm") or None,
        "description": row.get("description") or None,
        "creation_context": row.get("creation_context") or None,
        "artwork_style": row.get("artwork_style") or None,
        "notable_owners": row.get("notable_owners") or None,
        "bart_score": _to_float(row.get("bart_score", "")),
        "image_url": row.get("image_url") or None,
    }


def _parse_sale(row: dict[str, str]) -> dict[str, Any]:
    return {
        "id": row["sale_id"],
        "artwork_id": row["artwork_id"],
        "artist_name": row["artist_name"],
        "category": row["category"],
        "sale_date": row["sale_date"],
        "auction_house": row.get("auction_house") or None,
        "sale_price_eur": _to_float(row["sale_price_eur"]) or 0.0,
        "estimate_low_eur": _to_float(row.get("estimate_low_eur", "")),
        "estimate_high_eur": _to_float(row.get("estimate_high_eur", "")),
        "sold_above_estimate": (row.get("sold_above_estimate", "").lower() == "true"),
        "price_change_pct": _to_float(row.get("price_change_pct", "")),
        "price_change_explanation": row.get("price_change_explanation") or None,
        "buyer_type": row.get("buyer_type") or None,
        "buyer_name": row.get("buyer_name") or None,
        "buyer_nationality": row.get("buyer_nationality") or None,
        "buyer_profile": row.get("buyer_profile") or None,
        "bart_score_buyer": _to_float(row.get("bart_score_buyer", "")),
        "seller_type": row.get("seller_type") or None,
        "seller_name": row.get("seller_name") or None,
        "seller_profile": row.get("seller_profile") or None,
        "bart_score_seller": _to_float(row.get("bart_score_seller", "")),
        "sale_location": row.get("sale_location") or None,
        "is_private_sale": (row.get("is_private_sale", "").lower() == "true"),
        "bart_score_sale": _to_float(row.get("bart_score_sale", "")),
        "source": row.get("source") or None,
    }


@dataclass
class Dataset:
    artworks: list[dict] = field(default_factory=list)
    sales: list[dict] = field(default_factory=list)
    artists: list[dict] = field(default_factory=list)

    artworks_by_id: dict[str, dict] = field(default_factory=dict)
    artworks_by_artist: dict[str, list[dict]] = field(default_factory=dict)
    artworks_by_category: dict[str, list[dict]] = field(default_factory=dict)

    sales_by_artwork: dict[str, list[dict]] = field(default_factory=dict)
    sales_by_artist: dict[str, list[dict]] = field(default_factory=dict)
    sales_by_category: dict[str, list[dict]] = field(default_factory=dict)

    artists_by_name: dict[str, dict] = field(default_factory=dict)
    artists_by_id: dict[str, dict] = field(default_factory=dict)

    enrichments: dict[str, dict] = field(default_factory=dict)

    @classmethod
    def load(cls) -> "Dataset":
        with ARTWORKS_CSV.open() as f:
            artworks = [_parse_artwork(r) for r in csv.DictReader(f)]
        with SALES_CSV.open() as f:
            sales = [_parse_sale(r) for r in csv.DictReader(f)]

        ds = cls(artworks=artworks, sales=sales)

        # Artwork indexes
        for a in artworks:
            ds.artworks_by_id[a["id"]] = a
            ds.artworks_by_artist.setdefault(a["artist_name"], []).append(a)
            ds.artworks_by_category.setdefault(a["category"], []).append(a)

        # Sale indexes
        for s in sales:
            ds.sales_by_artwork.setdefault(s["artwork_id"], []).append(s)
            ds.sales_by_artist.setdefault(s["artist_name"], []).append(s)
            ds.sales_by_category.setdefault(s["category"], []).append(s)

        # Sort sales chronologically inside each bucket
        for bucket in (ds.sales_by_artwork, ds.sales_by_artist, ds.sales_by_category):
            for k in bucket:
                bucket[k].sort(key=lambda s: s["sale_date"])

        # Derive artists from artworks + sales aggregates
        artist_acc: dict[str, dict] = {}
        for a in artworks:
            aid = a["artist_id"]
            if aid not in artist_acc:
                artist_acc[aid] = {
                    "id": aid,
                    "name": a["artist_name"],
                    "category": a["category"],
                    "artwork_count": 0,
                    "sales_count": 0,
                    "avg_price_eur": 0.0,
                    "median_price_eur": 0.0,
                    "max_price_eur": 0.0,
                }
            artist_acc[aid]["artwork_count"] += 1
        for name, sales_list in ds.sales_by_artist.items():
            prices = [s["sale_price_eur"] for s in sales_list if s["sale_price_eur"]]
            for art in artist_acc.values():
                if art["name"] == name:
                    art["sales_count"] = len(sales_list)
                    if prices:
                        art["avg_price_eur"] = round(sum(prices) / len(prices), 2)
                        art["median_price_eur"] = round(statistics.median(prices), 2)
                        art["max_price_eur"] = round(max(prices), 2)
                    break

        ds.artists = list(artist_acc.values())
        ds.artists_by_id = {a["id"]: a for a in ds.artists}
        ds.artists_by_name = {a["name"]: a for a in ds.artists}

        # Enrichments (drivers / story / scoreBreakdown / provenance) for hero artworks
        if ENRICHMENTS_JSON.exists():
            try:
                ds.enrichments = json.loads(ENRICHMENTS_JSON.read_text())
            except json.JSONDecodeError:
                ds.enrichments = {}

        return ds

    # ─── Search helpers ──────────────────────────────────────────────────

    def search_artworks(
        self,
        query: str,
        category: str | None = None,
        limit: int = 5,
    ) -> list[dict]:
        """Lightweight ranked search across metadata and linked sale narratives."""
        q = _normalize_search_text(query)
        terms = _query_terms(query)
        pool = self.artworks_by_category.get(category, self.artworks) if category else self.artworks
        if not q:
            return pool[:limit]
        scored: list[tuple[int, dict]] = []
        for a in pool:
            score = 0
            sale_text = " ".join(
                filter(
                    None,
                    [
                        s.get("price_change_explanation")
                        for s in self.sales_by_artwork.get(a["id"], [])
                    ],
                )
            )
            haystacks = [
                (a["title"] or "", 4),
                (" ".join(_ARTWORK_SEARCH_ALIASES.get(a["id"], [])), 6),
                (a["artist_name"] or "", 3),
                (a["artwork_style"] or "", 2),
                (a["description"] or "", 1),
                (a["creation_context"] or "", 1),
                (sale_text, 2),
            ]
            for text, weight in haystacks:
                normalized = _normalize_search_text(text)
                if q in normalized:
                    score += weight * 8
                if terms:
                    matches = sum(1 for term in terms if term in normalized)
                    if matches:
                        score += matches * weight
                        if matches == len(terms):
                            score += weight * 3
            if score:
                scored.append((score, a))
        scored.sort(key=lambda x: (-x[0], -(x[1]["bart_score"] or 0)))
        return [a for _, a in scored[:limit]]

    def search_artists(self, query: str, limit: int = 5) -> list[dict]:
        q = query.lower().strip()
        if not q:
            return self.artists[:limit]
        return [a for a in self.artists if q in a["name"].lower()][:limit]

    def get_recent_sales(
        self,
        category: str | None = None,
        artist_name: str | None = None,
        artwork_id: str | None = None,
        limit: int = 10,
    ) -> list[dict]:
        """Sales with their narrative explanation, most recent first."""
        if artwork_id:
            pool = self.sales_by_artwork.get(artwork_id, [])
        elif artist_name:
            pool = self.sales_by_artist.get(artist_name, [])
        elif category:
            pool = self.sales_by_category.get(category, [])
        else:
            pool = self.sales
        return sorted(pool, key=lambda s: s["sale_date"], reverse=True)[:limit]

    def get_segment_summary(self, category: str) -> dict:
        sales = self.sales_by_category.get(category, [])
        if not sales:
            return {"error": f"No sales for category '{category}'"}
        prices = [s["sale_price_eur"] for s in sales if s["sale_price_eur"]]
        above_estimate = [s for s in sales if s["sold_above_estimate"]]
        artists = sorted({s["artist_name"] for s in sales})
        artworks = self.artworks_by_category.get(category, [])
        return {
            "category": category,
            "sale_count": len(sales),
            "artwork_count": len(artworks),
            "artists": artists,
            "avg_price_eur": round(sum(prices) / len(prices), 2) if prices else 0,
            "median_price_eur": round(statistics.median(prices), 2) if prices else 0,
            "max_price_eur": round(max(prices), 2) if prices else 0,
            "min_price_eur": round(min(prices), 2) if prices else 0,
            "pct_above_estimate": round(100 * len(above_estimate) / len(sales), 1),
            "first_sale_date": sales[0]["sale_date"] if sales else None,
            "last_sale_date": sales[-1]["sale_date"] if sales else None,
        }

    def get_top_constituents(self, category: str, limit: int = 10) -> list[dict]:
        """Top artists in a category, weighted by median price × sale count.

        Rationale: total-volume weighting is dominated by single outlier sales
        (e.g. Banksy BNK001 at 21M€ skews Street Art). Using median × count
        produces a balanced, demo-friendly distribution that still reflects
        each artist's true scale in the segment.
        """
        sales = self.sales_by_category.get(category, [])
        if not sales:
            return []

        last_year = max(s["sale_date"][:4] for s in sales)
        prev_year = str(int(last_year) - 1)

        by_artist: dict[str, dict] = {}
        for s in sales:
            name = s["artist_name"]
            if name not in by_artist:
                by_artist[name] = {"name": name, "prices": [], "ytd_prices": [], "prev_prices": []}
            by_artist[name]["prices"].append(s["sale_price_eur"])
            year = s["sale_date"][:4]
            if year == last_year:
                by_artist[name]["ytd_prices"].append(s["sale_price_eur"])
            elif year == prev_year:
                by_artist[name]["prev_prices"].append(s["sale_price_eur"])

        # Weight = median × count. Outlier-resistant.
        weighted = []
        for a in by_artist.values():
            median = statistics.median(a["prices"]) if a["prices"] else 0
            score = median * len(a["prices"])
            weighted.append((a, score))

        total_score = sum(s for _, s in weighted) or 1.0
        results = []
        for a, score in weighted:
            ytd_avg = statistics.median(a["ytd_prices"]) if a["ytd_prices"] else 0
            prev_avg = statistics.median(a["prev_prices"]) if a["prev_prices"] else 0
            ytd_pct = round((ytd_avg / prev_avg - 1) * 100, 1) if prev_avg > 0 else 0
            results.append({
                "artist": a["name"],
                "weight": round(100 * score / total_score, 1),
                "ytd": ytd_pct,
            })
        results.sort(key=lambda x: -x["weight"])
        return results[:limit]

    def get_index_summary(self, category: str) -> dict:
        """Rich summary used by the dashboard: latest value, multi-period changes, vol, constituents."""
        series = self.get_index(category=category).get(category, [])
        if not series:
            return {}

        latest = series[-1]
        first = series[0]
        prev = series[-2] if len(series) >= 2 else first

        # Year-over-year, 5y, ytd
        last_year = latest["date"][:4]
        ytd_base = next((p for p in series if p["date"].startswith(last_year)), latest)
        y1_target_date = f"{int(last_year) - 1}{latest['date'][4:7]}"
        y1_base = min(series, key=lambda p: abs(_date_diff_months(p["date"], y1_target_date))) if len(series) >= 4 else first
        y5_target_date = f"{int(last_year) - 5}{latest['date'][4:7]}"
        y5_base = min(series, key=lambda p: abs(_date_diff_months(p["date"], y5_target_date))) if len(series) >= 12 else first

        change_30d = round(latest["value"] / prev["value"] * 100 - 100, 2)
        change_ytd = round(latest["value"] / ytd_base["value"] * 100 - 100, 2)
        change_1y = round(latest["value"] / y1_base["value"] * 100 - 100, 2)
        change_5y = round(latest["value"] / y5_base["value"] * 100 - 100, 2)
        # Synthesize short-term moves as a fraction of the quarterly delta
        change_1d = round(change_30d / 30, 2)
        change_7d = round(change_30d / 4.3, 2)

        # Annualized volatility from quarterly returns. Use median-clipped returns
        # so a single outlier (e.g. the Girl with Balloon repeat-sale jump) doesn't blow up the metric.
        returns = [series[i]["value"] / series[i - 1]["value"] - 1 for i in range(1, len(series))]
        if len(returns) >= 2:
            # Hard cap quarterly returns at ±35% to neutralize repeat-sale outliers
            clipped = [max(min(r, 0.35), -0.35) for r in returns]
            vol = round(statistics.stdev(clipped) * (4 ** 0.5) * 100, 1)
        else:
            vol = 0.0

        sales = self.sales_by_category.get(category, [])
        total_volume_eur = sum(s["sale_price_eur"] for s in sales)

        return {
            "category": category,
            "value": latest["value"],
            "change_1d": change_1d,
            "change_7d": change_7d,
            "change_30d": change_30d,
            "change_ytd": change_ytd,
            "change_1y": change_1y,
            "change_5y": change_5y,
            "vol": vol,
            "volume_eur": total_volume_eur,
            "sale_count": len(sales),
            "history": series,
            "top_constituents": self.get_top_constituents(category, limit=10),
        }

    def get_artist_summary(self, name: str) -> dict:
        """Aggregate stats for an artist used on ArtistPage."""
        artist = self.artists_by_name.get(name)
        if not artist:
            return {}
        sales = self.sales_by_artist.get(name, [])
        artworks = self.artworks_by_artist.get(name, [])

        last_year = max(s["sale_date"][:4] for s in sales) if sales else ""
        recent_sales = [s for s in sales if s["sale_date"][:4] >= str(int(last_year) - 4)] if last_year else []
        sold_above = sum(1 for s in sales if s["sold_above_estimate"])
        sell_through = round(100 * sold_above / len(sales), 1) if sales else 0
        # Average % over estimate (only on lots that sold above)
        deltas = []
        for s in sales:
            if s["sold_above_estimate"] and s["estimate_high_eur"]:
                deltas.append((s["sale_price_eur"] / s["estimate_high_eur"] - 1) * 100)
        over_est = round(statistics.mean(deltas), 1) if deltas else 0

        # Quarterly artist index (median price), normalized to 100 at first quarter
        by_q: dict[str, list[float]] = defaultdict(list)
        for s in sales:
            by_q[s["sale_date"][:7]].append(s["sale_price_eur"])
        quarters = sorted(by_q)
        if quarters:
            base = statistics.median(by_q[quarters[0]])
            history = [
                {"date": q + "-15", "value": round(statistics.median(by_q[q]) / base * 100, 2) if base else 100}
                for q in quarters
            ]
        else:
            history = []

        # Galleries / dominant medium are not in CSV — heuristics from notable_owners + medium
        mediums = [a["medium"] for a in artworks if a["medium"]]
        dominant_medium = max(set(mediums), key=mediums.count) if mediums else None
        avg_score = round(statistics.mean([a["bart_score"] for a in artworks if a["bart_score"]]), 1) if artworks else 0

        return {
            **artist,
            "auctions_5y": len(recent_sales),
            "sell_through_pct": sell_through,
            "over_estimate_pct": over_est,
            "dominant_medium": dominant_medium,
            "bart_score": avg_score,
            "index_history": history,
            "artworks": [self._trim_artwork(a) for a in artworks],
        }

    def _trim_artwork(self, a: dict) -> dict:
        return {
            "id": a["id"],
            "title": a["title"],
            "year_created": a["year_created"],
            "medium": a["medium"],
            "bart_score": a["bart_score"],
            "category": a["category"],
        }

    def get_artwork_aggregates(self, artwork_id: str) -> dict:
        """Derived metrics for an artwork: fair value, last sale, 5y return."""
        artwork = self.artworks_by_id.get(artwork_id)
        if not artwork:
            return {}
        sales = self.sales_by_artwork.get(artwork_id, [])
        if not sales:
            return {}
        last_sale = sales[-1]
        first_sale = sales[0]
        last_price = last_sale["sale_price_eur"]
        # Fair value = last price ± 8% (placeholder — could be from a model)
        fair_low = round(last_price * 0.92, 0)
        fair_high = round(last_price * 1.08, 0)
        fair_mid = round(last_price, 0)
        fair_range_pct = 8

        five_y = round(last_price / first_sale["sale_price_eur"] * 100 - 100, 1) if first_sale["sale_price_eur"] else 0

        # Confidence = function of sale count + recency
        last_year = int(last_sale["sale_date"][:4])
        recency_score = max(0, 25 - (2024 - last_year) * 3)
        depth_score = min(30, len(sales) * 8)
        confidence = min(100, recency_score + depth_score + 30)
        liquidity = min(100, len(sales) * 22 + 12)

        return {
            "fair_value_low_eur": fair_low,
            "fair_value_mid_eur": fair_mid,
            "fair_value_high_eur": fair_high,
            "fair_value_range_pct": fair_range_pct,
            "confidence": confidence,
            "liquidity": liquidity,
            "five_y_return_pct": five_y,
            "last_sale": {
                "price_eur": last_price,
                "date": last_sale["sale_date"],
                "auction_house": last_sale["auction_house"],
            },
        }

    def get_index(self, category: str | None = None) -> dict[str, list[dict]]:
        """Quarterly median-price index per category, normalized to 100 at first quarter."""
        cats = [category] if category else list(self.sales_by_category.keys())
        result: dict[str, list[dict]] = {}
        for cat in cats:
            sales = self.sales_by_category.get(cat, [])
            by_q: dict[str, list[float]] = defaultdict(list)
            for s in sales:
                quarter_key = s["sale_date"][:7]  # YYYY-MM
                by_q[quarter_key].append(s["sale_price_eur"])
            if not by_q:
                continue
            quarters = sorted(by_q)
            base = statistics.median(by_q[quarters[0]])
            if base == 0:
                continue
            result[cat] = [
                {
                    "date": q + "-15",
                    "value": round(statistics.median(by_q[q]) / base * 100, 2),
                    "sale_count": len(by_q[q]),
                }
                for q in quarters
            ]
        return result


# ─── Singleton accessor (set by FastAPI lifespan) ────────────────────────

_dataset: Dataset | None = None


def init() -> Dataset:
    global _dataset
    _dataset = Dataset.load()
    return _dataset


def get() -> Dataset:
    if _dataset is None:
        raise RuntimeError("Dataset not initialized. Call services.dataset.init() first.")
    return _dataset
