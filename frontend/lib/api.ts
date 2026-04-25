const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Artwork {
  id: string;
  artist_id: string;
  artist_name: string;
  category: string;
  title: string;
  year_created: number | null;
  medium: string | null;
  dimensions_cm: string | null;
  description: string | null;
  creation_context: string | null;
  artwork_style: string | null;
  notable_owners: string | null;
  bart_score: number | null;
  image_url: string | null;
}

export interface Sale {
  id: string;
  artwork_id: string;
  sale_date: string;
  auction_house: string | null;
  sale_price_eur: number;
  estimate_low_eur: number | null;
  estimate_high_eur: number | null;
  sold_above_estimate: boolean | null;
  buyer_type: string | null;
  buyer_name: string | null;
  buyer_nationality: string | null;
  seller_type: string | null;
  seller_name: string | null;
  sale_location: string | null;
  source: string | null;
}

export type IndexData = Record<string, { date: string; value: number }[]>;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export const api = {
  artworks: () => get<Artwork[]>("/api/v1/artworks"),
  artwork: (id: string) => get<Artwork>(`/api/v1/artworks/${id}`),
  sales: (artworkId: string) => get<Sale[]>(`/api/v1/artworks/${artworkId}/sales`),
  indices: () => get<IndexData>("/api/v1/indices"),
  chat: (message: string, artwork_id?: string) =>
    fetch(`${BASE}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, artwork_id }),
    }).then((r) => r.json() as Promise<{ response: string }>),
};
