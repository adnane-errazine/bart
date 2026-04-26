"use client";

import { useEffect, useState } from "react";
import { api, type IndexSummary } from "./api";
import { enrichIndices, type RichIndex } from "./indexMeta";

export function useIndices(): { indices: RichIndex[]; loading: boolean; error: string | null } {
  const [summaries, setSummaries] = useState<IndexSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.indicesSummary()
      .then((s) => { if (!cancelled) setSummaries(s); })
      .catch((e) => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { indices: enrichIndices(summaries), loading, error };
}
