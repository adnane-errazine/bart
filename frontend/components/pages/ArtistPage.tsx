"use client";

import { useEffect, useRef, useState } from "react";
import { fmtEur, synthPainting } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ArrowLeft } from "lucide-react";
import { api, type ArtistSummary, type Artist } from "@/lib/api";

interface Props {
  artistId?: string;
  onNavigate: (r: string, param?: string) => void;
}

const CATEGORIES = ["All", "Street Art", "Blue Chip", "Modern Masters", "Ultra-Contemporary", "Photography"];

// ─── List view ────────────────────────────────────────────────────────────────

function ArtistList({ onNavigate }: { onNavigate: (r: string, p?: string) => void }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.artists().then((data) => {
      setArtists(data);
      setLoading(false);
    });
  }, []);

  const visible = artists.filter((a) => category === "All" || a.category === category);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Directory</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Artists</h1>
          <div className="caption mt-4">{artists.length} artists tracked</div>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORIES.map((c) => (
          <button key={c} className={`pill${category === c ? " active" : ""}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="caption" style={{ padding: "24px 0" }}>Loading artists…</div>
      ) : (
        <div className="peer-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {visible.map((a) => (
            <div key={a.id} className="peer-card" onClick={() => onNavigate("artist", a.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div
                  style={{ width: 40, height: 40, flexShrink: 0 }}
                  dangerouslySetInnerHTML={{ __html: synthPainting(a.id.length * 7) }}
                />
                <div>
                  <div className="peer-name">{a.name}</div>
                  <div className="peer-meta" style={{ fontSize: 10 }}>{a.category}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", fontSize: 11 }}>
                <div>
                  <div style={{ color: "var(--text-tertiary)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Works</div>
                  <div className="mono">{a.artwork_count}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-tertiary)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sales</div>
                  <div className="mono">{a.sales_count}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-tertiary)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Median</div>
                  <div className="mono text-amber">{fmtEur(a.median_price_eur, true)}</div>
                </div>
                <div>
                  <div style={{ color: "var(--text-tertiary)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em" }}>Max</div>
                  <div className="mono">{fmtEur(a.max_price_eur, true)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function ArtistDetail({ artistId, onNavigate }: { artistId: string; onNavigate: (r: string, p?: string) => void }) {
  const [artist, setArtist] = useState<ArtistSummary | null>(null);
  const [peers, setPeers] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.artist(artistId), api.artists()]).then(([a, all]) => {
      if (cancelled) return;
      setArtist(a);
      setPeers(all.filter((p) => p.category === a.category && p.id !== a.id).slice(0, 4));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [artistId]);

  useEffect(() => {
    if (!chartRef.current || !artist || artist.index_history.length === 0) return;
    const initChart = async () => {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);
      if (chartInstance.current) (chartInstance.current as { destroy: () => void }).destroy();
      const getCssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      chartInstance.current = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels: artist.index_history.map((p) => p.date),
          datasets: [{
            label: artist.name,
            data: artist.index_history.map((p) => p.value),
            borderColor: getCssVar("--accent-amber"),
            backgroundColor: "transparent",
            borderWidth: 1.6,
            tension: 0.05,
            pointRadius: 0,
            pointHoverRadius: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { backgroundColor: getCssVar("--bg-elevated"), titleColor: getCssVar("--text-primary"), bodyColor: getCssVar("--text-secondary"), borderColor: getCssVar("--border-strong"), borderWidth: 1, padding: 10, cornerRadius: 0, titleFont: { family: getCssVar("--font-mono"), size: 10 }, bodyFont: { family: getCssVar("--font-mono"), size: 11 } },
          },
          scales: {
            x: { grid: { color: getCssVar("--border-subtle"), lineWidth: 0.5 }, ticks: { color: getCssVar("--text-tertiary"), font: { family: getCssVar("--font-mono"), size: 9 }, maxRotation: 0, autoSkipPadding: 30 } },
            y: { position: "right", grid: { color: getCssVar("--border-subtle"), lineWidth: 0.5 }, border: { display: false }, ticks: { color: getCssVar("--text-tertiary"), font: { family: getCssVar("--font-mono"), size: 9 }, padding: 8 } },
          },
        },
      });
    };
    initChart();
    return () => { if (chartInstance.current) (chartInstance.current as { destroy: () => void }).destroy(); };
  }, [artist]);

  if (loading || !artist) {
    return <div className="page"><div className="caption">Loading artist…</div></div>;
  }

  return (
    <div className="page">
      <button
        className="tool-btn mb-16"
        style={{ display: "flex", alignItems: "center", gap: 4 }}
        onClick={() => onNavigate("artist")}
      >
        <ArrowLeft size={12} strokeWidth={1.6} />
        All Artists
      </button>

      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Artists <span className="sep">/</span> {artist.category}</div>
          <h1 className="h1 serif" style={{ marginTop: 6 }}>{artist.name}</h1>
          <div className="caption mt-4">{artist.artwork_count} works tracked · {artist.sales_count} sales on record</div>
        </div>
      </div>

      <div className="signature-metrics mb-24">
        <div className="sig-cell score"><ScoreCircle value={artist.bart_score} max={100} label="AVG WORK SCORE" /></div>
        <div className="sig-cell">
          <div className="metric-label">AUCTIONS 5Y</div>
          <div className="metric-value">{artist.auctions_5y}</div>
          <div className="metric-sub">lots adjudicated</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">SELL-THROUGH</div>
          <div className="metric-value">{artist.sell_through_pct}<span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>%</span></div>
          <div className="metric-sub">lots sold above estimate</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">AVG OVER ESTIMATE</div>
          <div className="metric-value">+{artist.over_estimate_pct}<span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>%</span></div>
          <div className="metric-sub">when above (12M)</div>
        </div>
      </div>

      <div className="grid-2-1 mb-24">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Artist Index</div>
            <div className="panel-meta">Median quarterly price · base 100</div>
          </div>
          <div className="panel-body">
            <div style={{ position: "relative", height: 280 }}>
              <canvas ref={chartRef} />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Profile</div></div>
          <div className="panel-body">
            <div className="form-row"><span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Segment</span><span>{artist.category}</span></div>
            <div className="form-row"><span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dominant Medium</span><span>{artist.dominant_medium ?? "—"}</span></div>
            <div className="form-row"><span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Median Price</span><span className="mono">{fmtEur(artist.median_price_eur, true)}</span></div>
            <div className="form-row"><span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Max Price</span><span className="mono">{fmtEur(artist.max_price_eur, true)}</span></div>
            <div className="form-row"><span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>Avg Price</span><span className="mono">{fmtEur(artist.avg_price_eur, true)}</span></div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-header-left"><div className="h2">Tracked Corpus · {artist.artworks.length} works</div></div>
        </div>
        <div className="artist-other-works" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {artist.artworks.slice(0, 18).map((w) => (
            <div key={w.id} className="other-work" onClick={() => onNavigate("artwork", w.id)}>
              <div className="other-work-img" dangerouslySetInnerHTML={{ __html: synthPainting(w.id.length * 5) }} />
              <div className="other-work-meta">
                <div className="row-name">{(w.title ?? "").slice(0, 28)}</div>
                <div>{w.year_created ?? "—"}</div>
                <div className="other-work-price mono text-amber">BART {w.bart_score ?? "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {peers.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-header-left"><div className="h2">Comparable Artists · {artist.category}</div></div>
          </div>
          <div className="peer-grid">
            {peers.map((p) => (
              <div key={p.id} className="peer-card" onClick={() => onNavigate("artist", p.id)}>
                <div className="peer-name">{p.name}</div>
                <div className="peer-meta">{p.artwork_count} works · {p.sales_count} sales</div>
                <div className="peer-score">{fmtEur(p.median_price_eur, true)}<span style={{ fontSize: 11, color: "var(--text-tertiary)" }}> median</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────

export function ArtistPage({ artistId, onNavigate }: Props) {
  if (!artistId) return <ArtistList onNavigate={onNavigate} />;
  return <ArtistDetail artistId={artistId} onNavigate={onNavigate} />;
}
