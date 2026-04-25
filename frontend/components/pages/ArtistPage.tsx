"use client";

import { useEffect, useRef } from "react";
import { ARTISTS, ARTWORKS } from "@/lib/data";
import { fmtEur, fmtPct, deltaClass, deltaTri, synthPainting, synthPortrait, monthlyLabels } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";

function DeltaSpan({ pct }: { pct: number }) {
  return (
    <span className={`delta ${deltaClass(pct)}`}>
      <span className="delta-tri">{deltaTri(pct)}</span>
      {fmtPct(pct)}
    </span>
  );
}

interface Props {
  artistId?: string;
  onNavigate: (r: string, param?: string) => void;
}

export function ArtistPage({ artistId = "lucy-bull", onNavigate }: Props) {
  const artist = ARTISTS.find((a) => a.id === artistId) || ARTISTS[0];
  const works = ARTWORKS.filter((w) => w.artistId === artist.id);
  const peers = ARTISTS.filter((a) => a.segment === artist.segment && a.id !== artist.id).slice(0, 4);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const initChart = async () => {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);
      if (chartInstance.current) (chartInstance.current as { destroy: () => void }).destroy();
      const getCssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      const labels = monthlyLabels(120);
      chartInstance.current = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [{ label: artist.name, data: artist.indexHistory, borderColor: getCssVar("--accent-amber"), backgroundColor: "transparent", borderWidth: 1.6, tension: 0.05, pointRadius: 0, pointHoverRadius: 4 }],
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
  }, [artistId, artist]);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Artists <span className="sep">/</span> {artist.segment} <span className="sep">/</span> {artist.nationality}</div>
          <h1 className="h1 serif" style={{ marginTop: 6 }}>{artist.name}</h1>
          <div className="caption mt-4">b. {artist.born} · {artist.nationality} · {artist.based}</div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Watchlist</button>
          <button className="tool-btn">Export memo</button>
        </div>
      </div>

      <div className="signature-metrics mb-24">
        <div className="sig-cell score"><ScoreCircle value={artist.bartScore} max={100} label="BART SCORE ARTIST" /></div>
        <div className="sig-cell">
          <div className="metric-label">AUCTIONS 5Y</div>
          <div className="metric-value">{artist.auctions5y}</div>
          <div className="metric-sub">lots adjudicated</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">SELL-THROUGH</div>
          <div className="metric-value">{artist.sellThrough}<span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>%</span></div>
          <div className="metric-sub">vs {artist.sellThrough - 18}% segment avg</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">AVG OVER ESTIMATE</div>
          <div className="metric-value">+{artist.overEst}<span style={{ fontSize: 14, color: "var(--text-tertiary)" }}>%</span></div>
          <div className="metric-sub">trailing 12M</div>
        </div>
      </div>

      <div className="grid-2-1 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Artist Index · 10Y</div><div className="panel-meta">Personal repeat-sales · base 100 Jan 2015</div></div>
          <div className="panel-body">
            <div style={{ position: "relative", height: 280 }}>
              <canvas ref={chartRef} />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Biography</div></div>
          <div className="panel-body">
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 13.5, lineHeight: 1.55, color: "var(--text-primary)" }}>{artist.bio}</div>
            <div className="mt-16">
              <div className="metric-label">REPRESENTED BY</div>
              <div className="mono mt-4" style={{ fontSize: 11 }}>{artist.galleries.join(" · ")}</div>
            </div>
            <div className="mt-16">
              <div className="metric-label">DOMINANT MEDIUM</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{artist.dominantMedium}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2-1 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Tracked Corpus</div><div className="panel-meta">{works.length} works</div></div>
          <div className="panel-body">
            {works.length > 0 ? (
              <div className="artist-other-works">
                {works.map((w) => (
                  <div key={w.id} className="other-work" onClick={() => onNavigate("artwork", w.id)}>
                    <div className="other-work-img" dangerouslySetInnerHTML={{ __html: synthPainting(w.id.length * 5) }} />
                    <div className="other-work-meta">
                      <div className="row-name">{w.title.slice(0, 28)}</div>
                      <div>{w.year}</div>
                      <div className="other-work-price">{fmtEur(w.fairValueMid, true)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="caption">No tracked works yet.</div>
            )}
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Press &amp; Institutional Timeline</div></div>
          <div className="panel-body" style={{ padding: "8px 18px" }}>
            {(artist.pressTimeline || []).map((p, i) => (
              <div key={i} className="prov-item">
                <div className="prov-year">{p.year}</div>
                <div className="prov-marker museum" />
                <div className="prov-body"><div className="prov-entity">{p.event}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-header-left"><div className="h2">Comparable Artists</div></div>
        </div>
        <div className="peer-grid">
          {peers.map((p) => (
            <div key={p.id} className="peer-card" onClick={() => onNavigate("artist", p.id)}>
              <div className="peer-name">{p.name}</div>
              <div className="peer-meta">b.{p.born} · {p.nationality}</div>
              <div className="peer-score">{p.bartScore}<span style={{ fontSize: 11, color: "var(--text-tertiary)" }}> / 100</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
