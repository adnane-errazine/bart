const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────

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
  // Aggregates returned by GET /artworks/{id}
  fair_value_low_eur?: number;
  fair_value_mid_eur?: number;
  fair_value_high_eur?: number;
  fair_value_range_pct?: number;
  confidence?: number;
  liquidity?: number;
  five_y_return_pct?: number;
  last_sale?: { price_eur: number; date: string; auction_house: string | null };
}

export interface Sale {
  id: string;
  artwork_id: string;
  artist_name: string;
  category: string;
  sale_date: string;
  auction_house: string | null;
  sale_price_eur: number;
  estimate_low_eur: number | null;
  estimate_high_eur: number | null;
  sold_above_estimate: boolean;
  price_change_pct: number | null;
  price_change_explanation: string | null;
  buyer_type: string | null;
  buyer_name: string | null;
  buyer_nationality: string | null;
  buyer_profile: string | null;
  seller_type: string | null;
  seller_name: string | null;
  seller_profile: string | null;
  sale_location: string | null;
}

export interface Artist {
  id: string;
  name: string;
  category: string;
  artwork_count: number;
  sales_count: number;
  avg_price_eur: number;
  median_price_eur: number;
  max_price_eur: number;
}

export interface ArtistSummary extends Artist {
  auctions_5y: number;
  sell_through_pct: number;
  over_estimate_pct: number;
  dominant_medium: string | null;
  bart_score: number;
  index_history: { date: string; value: number }[];
  artworks: Pick<Artwork, "id" | "title" | "year_created" | "medium" | "bart_score" | "category">[];
}

export interface IndexPoint {
  date: string;
  value: number;
  sale_count: number;
}

export interface IndexSummary {
  category: string;
  value: number;
  change_1d: number;
  change_7d: number;
  change_30d: number;
  change_ytd: number;
  change_1y: number;
  change_5y: number;
  vol: number;
  volume_eur: number;
  sale_count: number;
  history: IndexPoint[];
  top_constituents: { artist: string; weight: number; ytd: number }[];
}

export interface Driver { num: string; title: string; text: string; impact: string }
export interface ProvenanceEntry { year: string; type: string; entity: string; detail: string }
export interface PressEntry { year: number; outlet: string; headline: string }
export interface Enrichment {
  drivers: Driver[];
  story: string[];
  story_sources: string[];
  score_breakdown: {
    bart: { provenance: number; authentication: number; momentum: number; validation: number; quality: number };
    confidence: { depth: number; recency: number; verification: number; observability: number };
    liquidity: { frequency: number; sell_through: number; depth: number; exit: number };
  };
  provenance: ProvenanceEntry[];
  risk_block: string;
  press_highlights: PressEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────

const NGROK_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: NGROK_HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

// ─── API surface ─────────────────────────────────────────────────────────

export const api = {
  artworks: (params?: { category?: string; artist_name?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.artist_name) q.set("artist_name", params.artist_name);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    const qs = q.toString();
    return get<Artwork[]>(`/api/v1/artworks${qs ? `?${qs}` : ""}`);
  },
  artwork: (id: string) => get<Artwork>(`/api/v1/artworks/${id}`),
  enrichment: (id: string) => get<Enrichment | null>(`/api/v1/artworks/${id}/enrichment`),
  sales: (artworkId: string) => get<Sale[]>(`/api/v1/artworks/${artworkId}/sales`),
  recentSales: (params?: { category?: string; artist_name?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.artist_name) q.set("artist_name", params.artist_name);
    if (params?.limit) q.set("limit", String(params.limit));
    const qs = q.toString();
    return get<Sale[]>(`/api/v1/sales${qs ? `?${qs}` : ""}`);
  },
  indices: () => get<Record<string, IndexPoint[]>>(`/api/v1/indices`),
  indicesSummary: () => get<IndexSummary[]>(`/api/v1/indices/summary`),
  artists: () => get<Artist[]>(`/api/v1/artists`),
  artist: (id: string) => get<ArtistSummary>(`/api/v1/artists/${id}`),
  chat: (message: string, history?: { role: string; content: string }[]) =>
    fetch(`${BASE}/api/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...NGROK_HEADERS },
      body: JSON.stringify({ message, history: history ?? [] }),
    }).then((r) => r.json() as Promise<{ response: string }>),
  signals: () => get<Signal[]>(`/api/v1/signals`),
  dailyBrief: () => get<DailyBrief>(`/api/v1/daily-brief`),
};

export interface Signal {
  time: string;
  type: "mover" | "fair-value" | "event" | "alert" | "watchlist" | "confidence";
  text: string;
  impact: string;
  impactClass: "up" | "down" | "neutral";
}

export interface DailyBrief {
  intro: string;
  bullets: { artist: string; segment: string; move: number; text: string }[];
  top_movers: { artist: string; segment: string; move: number; driver: string }[];
  updated_at: string;
}
