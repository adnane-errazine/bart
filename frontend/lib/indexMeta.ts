/**
 * Per-segment immutable metadata that doesn't come from the CSV.
 * Merged with API summaries by enrichIndex().
 */

import type { IndexSummary, IndexPoint } from "./api";

export interface IndexMeta {
  id: string;       // slug used in URLs / state
  category: string; // matches API category exactly
  short: string;    // 3-letter ticker
  name: string;     // full display name
  scope: string;    // descriptive scope of the segment
  method: string;   // methodology label
  desc: string;     // 1-2 sentence pitch
  confidence: number;
}

export const INDEX_META: IndexMeta[] = [
  {
    id: "blue_chip",
    category: "Blue Chip",
    short: "BBC",
    name: "BART BLUE CHIP",
    scope: "Artistes décédés majeurs post-1850",
    method: "Repeat-Sales",
    desc: "Artistes décédés majeurs, établis depuis plus de 30 ans. Référence trophy assets. Volatilité contenue, corrélation modérée à l'inflation.",
    confidence: 88,
  },
  {
    id: "modern",
    category: "Modern Masters",
    short: "BMM",
    name: "BART MODERN MASTERS",
    scope: "Artistes établis post-1945",
    method: "Hedonic+Repeat",
    desc: "Artistes modernes établis post-1945. Effet career stage très marqué — Hockney, Richter, Kusama portés par les rétrospectives muséales.",
    confidence: 81,
  },
  {
    id: "ultra",
    category: "Ultra-Contemporary",
    short: "BUC",
    name: "BART ULTRA-CONTEMPORARY",
    scope: "Artistes vivants nés post-1975",
    method: "Hedonic",
    desc: "Artistes vivants nés après 1975, secondaire actif depuis 2010. Le segment qui a le mieux performé sur 5 ans, aussi le plus risqué.",
    confidence: 64,
  },
  {
    id: "photo",
    category: "Photography",
    short: "BPH",
    name: "BART PHOTOGRAPHY",
    scope: "Photographes 1900–aujourd'hui",
    method: "Hedonic",
    desc: "Photographie de collection. Faible corrélation aux autres indices, excellent diversificateur. Düsseldorf School poids dominant.",
    confidence: 73,
  },
  {
    id: "street",
    category: "Street Art",
    short: "BSU",
    name: "BART STREET & URBAN",
    scope: "Street artists post-2000",
    method: "Repeat-Sales",
    desc: "Art urbain accepté en circuit institutionnel. Porté par les jeunes UHNWIs et le segment millennials/tech entrepreneurs. Volatilité élevée.",
    confidence: 58,
  },
];

// ─── Enrichment helpers ──────────────────────────────────────────────────

export interface RichIndex {
  id: string;
  name: string;
  short: string;
  category: string;
  scope: string;
  method: string;
  desc: string;
  value: number;
  change1d: number;
  change7d: number;
  change30d: number;
  changeYtd: number;
  change1y: number;
  change5y: number;
  vol: number;
  volume: string;       // formatted ("EUR 1.2B")
  confidence: number;
  topConstituents: { artist: string; weight: number; ytd: number }[];
  history5y: number[];  // last ~20 quarter values for the chart
  spark30d: number[];   // last 8-12 quarter values for the sparkline
  saleCount: number;
}

function fmtVolume(v: number): string {
  if (v >= 1e9) return `EUR ${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `EUR ${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `EUR ${(v / 1e3).toFixed(0)}k`;
  return `EUR ${v.toFixed(0)}`;
}

export function enrichIndex(summary: IndexSummary): RichIndex | null {
  const meta = metaByCategory(summary.category);
  if (!meta) return null;
  const history = summary.history.map((p: IndexPoint) => p.value);
  return {
    id: meta.id,
    name: meta.name,
    short: meta.short,
    category: meta.category,
    scope: meta.scope,
    method: meta.method,
    desc: meta.desc,
    value: summary.value,
    change1d: summary.change_1d,
    change7d: summary.change_7d,
    change30d: summary.change_30d,
    changeYtd: summary.change_ytd,
    change1y: summary.change_1y,
    change5y: summary.change_5y,
    vol: summary.vol,
    volume: fmtVolume(summary.volume_eur),
    confidence: meta.confidence,
    topConstituents: summary.top_constituents,
    history5y: history.slice(-20),
    spark30d: history.slice(-12),
    saleCount: summary.sale_count,
  };
}

export function enrichIndices(summaries: IndexSummary[]): RichIndex[] {
  return summaries.map(enrichIndex).filter((x): x is RichIndex => x !== null);
}


export function metaByCategory(category: string): IndexMeta | undefined {
  return INDEX_META.find((m) => m.category === category);
}

export function metaById(id: string): IndexMeta | undefined {
  return INDEX_META.find((m) => m.id === id);
}
