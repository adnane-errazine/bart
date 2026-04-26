"use client";

import { useState, useEffect, useRef } from "react";
import { fmtPct, deltaClass, deltaTri, synthSeries, monthlyLabels } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";
import { useIndices } from "@/lib/useIndices";

function scoreDots(score: number) {
  const filled = Math.round((score / 100) * 10);
  return (
    <span className="score-dots">
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`score-dot${i < filled ? " filled" : ""}`} />
      ))}
    </span>
  );
}

function DeltaSpan({ pct }: { pct: number }) {
  const cls = deltaClass(pct);
  return (
    <span className={`delta ${cls}`}>
      <span className="delta-tri">{deltaTri(pct)}</span>
      {fmtPct(pct)}
    </span>
  );
}

export function MarketsPage() {
  const { indices: INDICES, loading } = useIndices();
  const [activeId, setActiveId] = useState("ultra");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  const index = INDICES.find((x) => x.id === activeId) || INDICES[0];

  useEffect(() => {
    if (!chartRef.current || !index) return;

    const initChart = async () => {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

      if (chartInstance.current) {
        (chartInstance.current as { destroy: () => void }).destroy();
      }

      const getCssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

      const labels = monthlyLabels(60);
      const base = index.history5y[0];
      const rebased = index.history5y.map((v) => +(v / base * 100).toFixed(2));
      const sp500 = synthSeries(100, 178, 60, 8);
      const gold = synthSeries(100, 145, 60, 6);
      const btc = synthSeries(100, 320, 60, 25);

      chartInstance.current = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: index.short, data: rebased, borderColor: getCssVar("--accent-amber"), backgroundColor: "transparent", borderWidth: 1.6, tension: 0.05, pointRadius: 0, pointHoverRadius: 4 },
            { label: "S&P 500", data: sp500, borderColor: getCssVar("--tag-observed"), backgroundColor: "transparent", borderDash: [3, 3], borderWidth: 1.2, tension: 0.05, pointRadius: 0, pointHoverRadius: 4 },
            { label: "Gold", data: gold, borderColor: getCssVar("--color-warning"), backgroundColor: "transparent", borderDash: [3, 3], borderWidth: 1.2, tension: 0.05, pointRadius: 0, pointHoverRadius: 4 },
            { label: "BTC", data: btc, borderColor: getCssVar("--tag-interpreted"), backgroundColor: "transparent", borderDash: [3, 3], borderWidth: 1.2, tension: 0.05, pointRadius: 0, pointHoverRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: getCssVar("--bg-elevated"), titleColor: getCssVar("--text-primary"),
              bodyColor: getCssVar("--text-secondary"), borderColor: getCssVar("--border-strong"),
              borderWidth: 1, padding: 10, cornerRadius: 0,
              titleFont: { family: getCssVar("--font-mono"), size: 10 },
              bodyFont: { family: getCssVar("--font-mono"), size: 11 },
            },
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
  }, [activeId, index]);

  if (loading || !index) {
    return <div className="page"><div className="caption">Loading indices…</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Markets <span className="sep">/</span> Indices <span className="sep">/</span> Drill-down</div>
          <h1 className="h1" style={{ marginTop: 6 }}>{index.name}</h1>
          <div className="caption mt-4">{index.scope} · Method: {index.method} · Volume backing {index.volume}</div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Compare</button>
          <button className="tool-btn">Methodology</button>
          <button className="tool-btn">Export</button>
        </div>
      </div>

      <div className="tabs">
        {INDICES.map((idx) => (
          <button
            key={idx.id}
            className={`tab${idx.id === activeId ? " active" : ""}`}
            onClick={() => setActiveId(idx.id)}
          >
            {idx.short} · {idx.name.replace("BART ", "")}
          </button>
        ))}
      </div>

      <div className="signature-metrics mb-24">
        <div className="sig-cell">
          <div className="metric-label">CURRENT VALUE</div>
          <div className="metric-value">{index.value.toFixed(2)}</div>
          <div className="metric-sub"><DeltaSpan pct={index.change1d} /> 1D</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">YTD</div>
          <div className="metric-value"><DeltaSpan pct={index.changeYtd} /></div>
          <div className="metric-sub"><DeltaSpan pct={index.change1y} /> 1Y · <DeltaSpan pct={index.change5y} /> 5Y</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">VOLATILITY (12M)</div>
          <div className="metric-value mono">{index.vol.toFixed(1)}%</div>
          <div className="metric-sub">Annualized rolling</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">CONFIDENCE</div>
          <div className="metric-value">{index.confidence}<span style={{ fontSize: 14, color: "var(--text-tertiary)" }}> / 100</span></div>
          <div className="metric-band">{scoreDots(index.confidence)}</div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <div className="section-header-left">
            <div className="h2">Index Performance · 5Y</div>
            <span className="caption">Base 100 = Jan 2020</span>
          </div>
          <div className="section-tools">
            <div className="range-tabs">
              {["1Y","3Y","5Y","10Y"].map((p) => (
                <button key={p} className={`range-tab${p === "5Y" ? " active" : ""}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div style={{ position: "relative", height: 340 }}>
              <canvas ref={chartRef} />
            </div>
            <div className="legend-row">
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--accent-amber)" }} />{index.short}</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--tag-observed)" }} />S&amp;P 500</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--color-warning)" }} />Gold</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--tag-interpreted)" }} />Bitcoin</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Methodology Breakdown</div><div className="panel-meta">Two-method convergence</div></div>
          <div className="panel-body">
            <div className="grid-2">
              <div><div className="metric-label">Repeat-Sales</div><div className="mono" style={{ fontSize: 18 }}>{index.value.toFixed(2)}</div><div className="caption mt-4">Case-Shiller-like, on revente pairs</div></div>
              <div><div className="metric-label">Hedonic</div><div className="mono" style={{ fontSize: 18 }}>{(index.value * 0.992).toFixed(2)}</div><div className="caption mt-4">Renneboog-Spaenjers regression</div></div>
            </div>
            <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--bg-tertiary)", borderLeft: "2px solid var(--color-up)", fontSize: 11.5, color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Convergence: 99.2%</strong> — methods agree within 80bp. Signal robust.
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Volume Backing &amp; Confidence</div><div className="panel-meta">Trailing 90D</div></div>
          <div className="panel-body">
            <div className="grid-2">
              <div><div className="metric-label">Transactions</div><div className="mono" style={{ fontSize: 18 }}>204</div><div className="caption mt-4">in last 90D</div></div>
              <div><div className="metric-label">Volume Total</div><div className="mono" style={{ fontSize: 18 }}>{index.volume}</div><div className="caption mt-4">trailing 12M</div></div>
            </div>
            <div className="mt-16">
              <div className="metric-label">CONFIDENCE OF THE INDEX</div>
              <div className="metric-band mt-4" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18 }}>{index.confidence}/100</div>
                <div className="metric-band-bar" style={{ flex: 1 }}><div className="metric-band-fill" style={{ width: `${index.confidence}%` }} /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2-1 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Top Constituents</div><div className="panel-meta">By weight · YTD performance</div></div>
          <div className="panel-body flush">
            <table className="dtable">
              <thead>
                <tr><th className="num">#</th><th>Artist</th><th className="num">Weight</th><th className="num">YTD</th><th className="num">YTD %</th></tr>
              </thead>
              <tbody>
                {(index.topConstituents || []).map((c, idx) => (
                  <tr key={idx}>
                    <td className="num muted">{idx + 1}</td>
                    <td><div className="row-name">{c.artist}</div></td>
                    <td className="num">{c.weight.toFixed(1)}%</td>
                    <td className="num">
                      <span className="inline-bar">
                        <span className={`inline-bar-fill ${c.ytd > 0 ? "up" : "down"}`} style={{ width: `${Math.min(Math.abs(c.ytd) * 2, 100)}%` }} />
                      </span>
                    </td>
                    <td className="num"><DeltaSpan pct={c.ytd} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Description</div><div className="panel-meta">Index profile</div></div>
          <div className="panel-body">
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{(index as { desc?: string }).desc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
