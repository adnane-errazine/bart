"use client";

import { useState, useEffect, useRef } from "react";
import { fmtPct, deltaTri, deltaClass } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";
import { useIndices } from "@/lib/useIndices";

export function IndicesPage() {
  const { indices: INDICES, loading } = useIndices();
  const [selected, setSelected] = useState<string | null>(null);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  const idx = INDICES.find((i) => i.id === (selected ?? INDICES[0]?.id)) ?? INDICES[0];

  useEffect(() => {
    if (!chartRef.current || !idx) return;
    const initChart = async () => {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, LineController, Tooltip);
      if (chartInstance.current) (chartInstance.current as { destroy: () => void }).destroy();
      const getCssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      const points = idx.history5y;
      const n = points.length;
      const labels = points.map((_, i) => {
        const q = i % 4;
        const startYear = new Date().getFullYear() - Math.ceil(n / 4);
        const y = startYear + Math.floor(i / 4);
        return q === 0 ? `${y}` : `Q${q + 1}`;
      });
      const base = points[0];
      const rebased = points.map((v) => +(v / base * 100).toFixed(2));

      chartInstance.current = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: idx.short,
            data: rebased,
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
            tooltip: {
              backgroundColor: getCssVar("--bg-elevated"),
              titleColor: getCssVar("--text-primary"),
              bodyColor: getCssVar("--text-secondary"),
              borderColor: getCssVar("--border-strong"),
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
  }, [idx]);

  if (loading || !idx) {
    return <div className="page"><div className="caption">Loading indices…</div></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Market Indices</div>
          <h1 className="h1" style={{ marginTop: 6 }}>BART Indices</h1>
        </div>
        <div className="page-header-right">
          <div className="range-tabs">
            {["1Y", "3Y", "5Y", "10Y"].map((r) => (
              <button key={r} className={`range-tab${r === "10Y" ? " active" : ""}`}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Index strip */}
      <div className="index-strip mb-24">
        {INDICES.map((i) => {
          const dir = i.change30d > 0 ? "up" : "down";
          const isActive = i.id === idx.id;
          return (
            <div key={i.id} className={`index-card${isActive ? " active" : ""}`}
              style={isActive ? { background: "var(--bg-tertiary)", borderBottom: "2px solid var(--accent-amber)" } : {}}
              onClick={() => setSelected(i.id)}>
              <div className="index-card-head">
                <div className="index-card-name">{i.short}</div>
                <div className="caption mono">{i.method.slice(0, 3).toUpperCase()}</div>
              </div>
              <div className="index-card-value">{i.value.toFixed(2)}</div>
              <div className="caption">{i.name.replace("BART ", "")}</div>
              <div className="index-card-meta">
                <span className={`delta ${dir}`}>
                  <span className="delta-tri">{deltaTri(i.change30d)}</span>{fmtPct(i.change30d)}
                </span>
                <Sparkline values={i.spark30d} direction={dir} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected index detail */}
      <div className="grid-3-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">{idx.name} · Performance</div>
            <div className="panel-meta">{idx.method} · base 100 = {idx.history5y.length > 0 ? `Q${1}, ${new Date().getFullYear() - Math.ceil(idx.history5y.length / 4)}` : ""}</div>
          </div>
          <div className="panel-body">
            <div className="grid-2 mb-16">
              {[
                { label: "1D", val: idx.change1d },
                { label: "7D", val: idx.change7d },
                { label: "30D", val: idx.change30d },
                { label: "YTD", val: idx.changeYtd },
                { label: "1Y", val: idx.change1y },
                { label: "5Y", val: idx.change5y },
              ].map((p) => (
                <div key={p.label} className="metric">
                  <div className="metric-label">{p.label} RETURN</div>
                  <div className={`metric-value sm delta ${deltaClass(p.val)}`}>
                    <span className="delta-tri">{deltaTri(p.val)}</span>{fmtPct(p.val)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ position: "relative", height: 280, border: "1px solid var(--border-subtle)", background: "var(--bg-tertiary)" }}>
              <canvas ref={chartRef} />
            </div>
          </div>
        </div>

        <div>
          <div className="panel mb-16">
            <div className="panel-head">
              <div className="panel-title">Index Profile</div>
            </div>
            <div className="panel-body">
              {[
                { label: "Scope", val: idx.scope },
                { label: "Method", val: idx.method },
                { label: "Confidence", val: `${idx.confidence}/100` },
                { label: "Volume", val: idx.volume },
                { label: "Sales", val: `${idx.saleCount}` },
                { label: "Ann. Volatility", val: `${idx.vol}%` },
              ].map((f) => (
                <div key={f.label} className="form-row" style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 12 }}>
                  <span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</span>
                  <span>{f.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><div className="panel-title">Description</div></div>
            <div className="panel-body" style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
              {idx.desc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
