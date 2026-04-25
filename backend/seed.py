import asyncio
import csv
import os
from datetime import date
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import asyncpg

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


async def seed():
    conn = await asyncpg.connect(os.environ["SUPABASE_URL"], timeout=10)

    schema = (Path(__file__).parent / "schema.sql").read_text()
    await conn.execute(schema)
    print("✓ Schema applied")

    # Artists (derived from artworks.csv)
    artist_seen: set[str] = set()
    with open(DATA_DIR / "artworks.csv") as f:
        for row in csv.DictReader(f):
            aid = row["artist_id"]
            if aid not in artist_seen:
                artist_seen.add(aid)
                await conn.execute(
                    "INSERT INTO artist (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING",
                    aid,
                    row["artist_name"],
                )
    print(f"✓ {len(artist_seen)} artists seeded")

    # Artworks
    count = 0
    with open(DATA_DIR / "artworks.csv") as f:
        for row in csv.DictReader(f):
            await conn.execute(
                """
                INSERT INTO artwork (
                    id, artist_id, artist_name, category, title, year_created, medium,
                    dimensions_cm, description, creation_context, artwork_style,
                    notable_owners, bart_score
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                ON CONFLICT (id) DO NOTHING
                """,
                row["artwork_id"],
                row["artist_id"],
                row["artist_name"],
                row["category"],
                row["title"],
                int(row["year_created"]) if row["year_created"] else None,
                row["medium"] or None,
                row["dimensions_cm"] or None,
                row["description"] or None,
                row["creation_context"] or None,
                row["artwork_style"] or None,
                row["notable_owners"] or None,
                float(row["bart_score"]) if row["bart_score"] else None,
            )
            count += 1
    print(f"✓ {count} artworks seeded")

    # Sales
    count = 0
    with open(DATA_DIR / "sales.csv") as f:
        for row in csv.DictReader(f):
            await conn.execute(
                """
                INSERT INTO sale (
                    id, artwork_id, sale_date, auction_house, sale_price_eur,
                    estimate_low_eur, estimate_high_eur, sold_above_estimate,
                    buyer_type, buyer_name, buyer_nationality,
                    seller_type, seller_name, sale_location, source
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                ON CONFLICT (id) DO NOTHING
                """,
                row["sale_id"],
                row["artwork_id"],
                date.fromisoformat(row["sale_date"]),
                row["auction_house"] or None,
                float(row["sale_price_eur"]),
                float(row["estimate_low_eur"]) if row["estimate_low_eur"] else None,
                float(row["estimate_high_eur"]) if row["estimate_high_eur"] else None,
                row["sold_above_estimate"].lower() == "true" if row["sold_above_estimate"] else None,
                row["buyer_type"] or None,
                row["buyer_name"] or None,
                row["buyer_nationality"] or None,
                row["seller_type"] or None,
                row["seller_name"] or None,
                row["sale_location"] or None,
                row["source"] or None,
            )
            count += 1
    print(f"✓ {count} sales seeded")

    await conn.close()
    print("✓ Done")


if __name__ == "__main__":
    asyncio.run(seed())
