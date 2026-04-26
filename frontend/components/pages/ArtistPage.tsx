"use client";

import { useEffect, useRef, useState } from "react";
import { fmtEur, synthPainting } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { api, type ArtistSummary, type Artist } from "@/lib/api";

interface Props {
  artistId?: string;
  onNavigate: (r: string, param?: string) => void;
}

const CATEGORIES = ["All", "Street Art", "Blue Chip", "Modern Masters", "Ultra-Contemporary", "Photography"];
const PAGE_SIZE = 20;

// ─── List view ────────────────────────────────────────────────────────────────

function ArtistList({ onNavigate }: { onNavigate: (r: string, p?: string) => void }) {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.artists().then((data) => {
      setArtists(data);
      setLoading(false);
    });
  }, []);

  const filtered = artists.filter((a) => {
    const matchCat = category === "All" || a.category === category;
    const matchSearch = !search.trim() || a.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchCat && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageArtists = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleFilter = (cat: string) => { setCategory(cat); setPage(0); };
  const handleSearch = (q: string) => { setSearch(q); setPage(0); };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Directory</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Artists</h1>
          <div className="caption mt-4">{filtered.length} artist{filtered.length !== 1 ? "s" : ""} tracked</div>
        </div>
      </div>

      <div className="filter-bar" style={{ alignItems: "center", marginBottom: 12 }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`pill${category === c ? " active" : ""}`} onClick={() => handleFilter(c)}>
            {c}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search artist…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          style={{ marginLeft: "auto", width: 180, padding: "4px 8px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12 }}
        />
      </div>

      <div className="panel">
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Artist</th>
                <th>Segment</th>
                <th className="num">Works</th>
                <th className="num">Sales</th>
                <th className="num">Avg Price</th>
                <th className="num">Median</th>
                <th className="num">Max</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="caption" style={{ padding: "20px 16px" }}>Loading…</td></tr>
              ) : pageArtists.length === 0 ? (
                <tr><td colSpan={8} className="caption" style={{ padding: "20px 16px" }}>No results.</td></tr>
              ) : pageArtists.map((a, i) => (
                <tr
                  key={a.id}
                  className="clickable"
                  onClick={() => onNavigate("artist", a.id)}
                >
                  <td className="mono text-tertiary" style={{ fontSize: 11 }}>{page * PAGE_SIZE + i + 1}</td>
                  <td>
                    <div className="row-icon">
                      <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(a.id.length * 7) }} />
                      <div className="row-name">{a.name}</div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 11 }}>
                    {a.category.replace("Ultra-Contemporary", "Ultra-C").replace("Modern Masters", "Modern")}
                  </td>
                  <td className="num mono muted" style={{ fontSize: 11 }}>{a.artwork_count}</td>
                  <td className="num mono muted" style={{ fontSize: 11 }}>{a.sales_count}</td>
                  <td className="num mono" style={{ fontSize: 11 }}>{fmtEur(a.avg_price_eur, true)}</td>
                  <td className="num mono text-amber" style={{ fontSize: 11 }}>{fmtEur(a.median_price_eur, true)}</td>
                  <td className="num mono" style={{ fontSize: 11 }}>{fmtEur(a.max_price_eur, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--border-subtle)" }}>
            <span className="caption mono">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className="tool-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i;
                return (
                  <button
                    key={pg}
                    className={`tool-btn${pg === page ? " active" : ""}`}
                    onClick={() => setPage(pg)}
                    style={{ padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                className="tool-btn"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
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
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip);
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
