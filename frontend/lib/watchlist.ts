"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type Artwork } from "@/lib/api";

const STORAGE_KEY = "bart.watchlist.v1";
const DEFAULT_WATCHLIST_IDS = ["BNK001", "PCB002", "JDF001", "WAR001", "GRS001"];

function readWatchlistIds() {
  if (typeof window === "undefined") return DEFAULT_WATCHLIST_IDS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string")
      ? parsed
      : DEFAULT_WATCHLIST_IDS;
  } catch {
    return DEFAULT_WATCHLIST_IDS;
  }
}

function writeWatchlistIds(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("bart-watchlist-change", { detail: ids }));
}

export function useWatchlist() {
  const [ids, setIds] = useState<string[]>(DEFAULT_WATCHLIST_IDS);

  useEffect(() => {
    setIds(readWatchlistIds());

    function refresh() {
      setIds(readWatchlistIds());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("bart-watchlist-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("bart-watchlist-change", refresh);
    };
  }, []);

  const add = useCallback((artworkId: string) => {
    const next = [artworkId, ...readWatchlistIds().filter((id) => id !== artworkId)];
    writeWatchlistIds(next);
    setIds(next);
  }, []);

  const remove = useCallback((artworkId: string) => {
    const next = readWatchlistIds().filter((id) => id !== artworkId);
    writeWatchlistIds(next);
    setIds(next);
  }, []);

  const has = useCallback((artworkId: string) => ids.includes(artworkId), [ids]);

  return { ids, add, remove, has };
}

export function useWatchlistArtworks(limit?: number) {
  const { ids, add, remove, has } = useWatchlist();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleIds = useMemo(() => ids.slice(0, limit ?? ids.length), [ids, limit]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(visibleIds.map((id) => api.artwork(id).catch(() => null))).then((items) => {
      if (cancelled) return;
      setArtworks(items.filter((item): item is Artwork => item !== null));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [visibleIds]);

  return { ids, artworks, loading, add, remove, has };
}
