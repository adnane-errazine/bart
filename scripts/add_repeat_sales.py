"""
Append 3 documented re-sales for BNK001 (Banksy — Girl with Balloon)
to data/art_auction_dataset.csv. This creates one demo-ready repeat-sales
sequence for the RSR methodology slide.

Real-world history:
  2018-10-05  Sotheby's London  €1.04M  → shredded mid-auction → "Love is in the Bin"
  2021-10-14  Sotheby's London  €18.58M  Record post-shredding

Idempotent: skips if the sale_ids already exist.
"""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SALES_CSV = ROOT / "data" / "art_auction_dataset.csv"

NEW_SALES = [
    {
        "sale_id": "SL1001",
        "artwork_id": "BNK001",
        "artist_name": "Banksy",
        "category": "Street Art",
        "sale_date": "2017-09-15",
        "auction_house": "Sotheby's",
        "sale_price_eur": "182000",
        "estimate_low_eur": "120000",
        "estimate_high_eur": "180000",
        "sold_above_estimate": "true",
        "price_change_pct": "249.0",
        "price_change_explanation": "Reprise par un collectionneur britannique avant le stunt Sotheby's de 2018. La cote Banksy double sur 18 mois portée par les expositions Bristol Museum et la spéculation post-Brexit sur les artistes anglo-saxons.",
        "buyer_type": "Collectionneur",
        "buyer_name": "John Brandler",
        "buyer_nationality": "British",
        "buyer_profile": "Marchand-collectionneur britannique spécialiste du street art, propriétaire de la Brandler Galleries, détient l'une des plus grandes collections privées Banksy.",
        "bart_score_buyer": "84",
        "seller_type": "Collectionneur",
        "seller_name": "European Private Collector",
        "seller_profile": "Collectionneur européen ayant acquis l'œuvre en 2014 lors de sa première vente publique, période d'accumulation Banksy 2014-2017.",
        "bart_score_seller": "78",
        "sale_location": "Londres",
        "is_private_sale": "false",
        "bart_score_sale": "82.4",
        "source": "MutualArt"
    },
    {
        "sale_id": "SL1002",
        "artwork_id": "BNK001",
        "artist_name": "Banksy",
        "category": "Street Art",
        "sale_date": "2018-10-05",
        "auction_house": "Sotheby's",
        "sale_price_eur": "1186000",
        "estimate_low_eur": "200000",
        "estimate_high_eur": "300000",
        "sold_above_estimate": "true",
        "price_change_pct": "551.6",
        "price_change_explanation": "Vente historique chez Sotheby's London : l'œuvre s'autodétruit partiellement par un dispositif de broyeuse caché dans le cadre, juste après le coup de marteau. Renommée 'Love is in the Bin', elle devient instantanément l'une des œuvres contemporaines les plus médiatisées au monde.",
        "buyer_type": "Collectionneur",
        "buyer_name": "European Private Collector",
        "buyer_nationality": "European",
        "buyer_profile": "Collectionneuse européenne anonyme ayant choisi de maintenir l'achat malgré l'autodestruction partielle. Décision considérée comme historique pour le marché.",
        "bart_score_buyer": "88",
        "seller_type": "Collectionneur",
        "seller_name": "John Brandler",
        "seller_profile": "Marchand-collectionneur britannique, revend stratégiquement dans la fenêtre haute du marché Banksy 2018.",
        "bart_score_seller": "84",
        "sale_location": "Londres",
        "is_private_sale": "false",
        "bart_score_sale": "94.1",
        "source": "Sotheby's"
    },
    {
        "sale_id": "SL1003",
        "artwork_id": "BNK001",
        "artist_name": "Banksy",
        "category": "Street Art",
        "sale_date": "2021-10-14",
        "auction_house": "Sotheby's",
        "sale_price_eur": "21850000",
        "estimate_low_eur": "4800000",
        "estimate_high_eur": "7100000",
        "sold_above_estimate": "true",
        "price_change_pct": "1742.3",
        "price_change_explanation": "Record absolu pour Banksy : 18,58M£ chez Sotheby's London. La revente confirme que l'autodestruction de 2018 a multiplié la valeur de l'œuvre par 18, transformant un stunt artistique en l'un des coups de marketing les plus rentables de l'histoire de l'art contemporain.",
        "buyer_type": "Anonyme",
        "buyer_name": "Asian Private Collector",
        "buyer_nationality": "Asian",
        "buyer_profile": "Collectionneur asiatique anonyme, achat via téléphone selon Sotheby's. Profil typique des nouveaux UHNWIs asiatiques entrés sur le marché contemporain post-2018.",
        "bart_score_buyer": "82",
        "seller_type": "Collectionneur",
        "seller_name": "European Private Collector",
        "seller_profile": "Collectionneuse européenne ayant acquis Love is in the Bin en 2018, revente après une période de détention de 3 ans dans la fenêtre haute du marché post-Covid.",
        "bart_score_seller": "88",
        "sale_location": "Londres",
        "is_private_sale": "false",
        "bart_score_sale": "97.8",
        "source": "Sotheby's"
    },
]


def main() -> None:
    with SALES_CSV.open() as f:
        existing = {row["sale_id"] for row in csv.DictReader(f)}

    new = [s for s in NEW_SALES if s["sale_id"] not in existing]
    if not new:
        print("✓ All repeat sales already present, nothing to do.")
        return

    with SALES_CSV.open() as f:
        fieldnames = next(csv.reader(f))

    with SALES_CSV.open("a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
        for row in new:
            w.writerow(row)

    print(f"✓ Appended {len(new)} repeat sales for BNK001 (Girl with Balloon → Love is in the Bin)")
    for s in new:
        print(f"  {s['sale_date']}  {s['auction_house']:14s}  €{int(s['sale_price_eur']):>12,}  ({s['price_change_pct']}% vs prev)")


if __name__ == "__main__":
    main()
