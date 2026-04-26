"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Artwork } from "@/lib/api";

const STORAGE_KEY = "bart.portfolio.v1";

export interface Holding {
  id: string;
  acquired_eur: number;
}

const DEFAULT_HOLDINGS: Holding[] = [
  { id: "BNK001", acquired_eur: 1_186_000 },
  { id: "JDF001", acquired_eur: 540_000 },
  { id: "WAR001", acquired_eur: 175_000_000 },
  { id: "GRS001", acquired_eur: 3_800_000 },
  { id: "HCK001", acquired_eur: 80_000_000 },
];

export const SEGMENT_COLORS: Record<string, string> = {
  "Blue Chip": "#6B8FB8",
  "Modern Masters": "#8C7AAE",
  "Street Art": "#B8722F",
  Photography: "#D4A017",
  "Ultra-Contemporary": "#4F9D69",
};

const FALLBACK_COLOR = "#6E7B8A";

function isHolding(value: unknown): value is Holding {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Holding).id === "string" &&
    typeof (value as Holding).acquired_eur === "number"
  );
}

function readHoldings(): Holding[] {
  if (typeof window === "undefined") return DEFAULT_HOLDINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every(isHolding) ? parsed : DEFAULT_HOLDINGS;
  } catch {
    return DEFAULT_HOLDINGS;
  }
}

function writeHoldings(holdings: Holding[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
  window.dispatchEvent(new CustomEvent("bart-portfolio-change", { detail: holdings }));
}

function fairValue(artwork: Artwork): number {
  return artwork.fair_value_mid_eur ?? artwork.last_sale?.price_eur ?? 0;
}

export interface PortfolioRow {
  holding: Holding;
  artwork: Artwork | null;
  current_eur: number;
  pnl_eur: number;
  pnl_pct: number;
}

export interface AllocationSlice {
  segment: string;
  value: number;
  pct: number;
  color: string;
}

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>(DEFAULT_HOLDINGS);
  const [artworks, setArtworks] = useState<Record<string, Artwork>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHoldings(readHoldings());
    function refresh() {
      setHoldings(readHoldings());
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("bart-portfolio-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("bart-portfolio-change", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(holdings.map((h) => api.artwork(h.id).catch(() => null))).then((items) => {
      if (cancelled) return;
      const next: Record<string, Artwork> = {};
      items.forEach((item, i) => {
        if (item) next[holdings[i].id] = item;
      });
      setArtworks(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [holdings]);

  const rows: PortfolioRow[] = useMemo(
    () =>
      holdings.map((holding) => {
        const artwork = artworks[holding.id] ?? null;
        const current_eur = artwork ? fairValue(artwork) : 0;
        const pnl_eur = current_eur - holding.acquired_eur;
        const pnl_pct = holding.acquired_eur > 0 ? (pnl_eur / holding.acquired_eur) * 100 : 0;
        return { holding, artwork, current_eur, pnl_eur, pnl_pct };
      }),
    [holdings, artworks]
  );

  const totals = useMemo(() => {
    const totalValue = rows.reduce((s, r) => s + r.current_eur, 0);
    const totalCost = rows.reduce((s, r) => s + r.holding.acquired_eur, 0);
    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { totalValue, totalCost, pnl, pnlPct };
  }, [rows]);

  const allocation: AllocationSlice[] = useMemo(() => {
    const bySegment = new Map<string, number>();
    rows.forEach((r) => {
      if (!r.artwork || r.current_eur <= 0) return;
      const segment = r.artwork.category;
      bySegment.set(segment, (bySegment.get(segment) ?? 0) + r.current_eur);
    });
    const total = Array.from(bySegment.values()).reduce((s, v) => s + v, 0);
    return Array.from(bySegment.entries())
      .map(([segment, value]) => ({
        segment,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
        color: SEGMENT_COLORS[segment] ?? FALLBACK_COLOR,
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const averages = useMemo(() => {
    const tracked = rows.filter((r) => r.artwork);
    if (tracked.length === 0) return { confidence: 0, liquidity: 0 };
    const confidence =
      tracked.reduce((s, r) => s + (r.artwork?.confidence ?? 0), 0) / tracked.length;
    const liquidity =
      tracked.reduce((s, r) => s + (r.artwork?.liquidity ?? 0), 0) / tracked.length;
    return { confidence, liquidity };
  }, [rows]);

  const concentration = useMemo(() => {
    if (allocation.length === 0) return { single: 0, singleSegment: "—", top3: 0, top3Segments: "—" };
    const single = allocation[0];
    const top3 = allocation.slice(0, 3);
    return {
      single: single.pct,
      singleSegment: single.segment,
      top3: top3.reduce((s, a) => s + a.pct, 0),
      top3Segments: top3.map((a) => a.segment).join(" + "),
    };
  }, [allocation]);

  const add = useCallback((id: string, acquired_eur: number) => {
    const current = readHoldings();
    const filtered = current.filter((h) => h.id !== id);
    const next = [{ id, acquired_eur }, ...filtered];
    writeHoldings(next);
    setHoldings(next);
  }, []);

  const remove = useCallback((id: string) => {
    const next = readHoldings().filter((h) => h.id !== id);
    writeHoldings(next);
    setHoldings(next);
  }, []);

  const has = useCallback((id: string) => holdings.some((h) => h.id === id), [holdings]);

  return { holdings, rows, artworks, loading, totals, allocation, averages, concentration, add, remove, has };
}
