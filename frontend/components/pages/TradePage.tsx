"use client";

import { useState, useEffect, useRef } from "react";
import { fmtPct, deltaClass, deltaTri, synthSeries, monthlyLabels } from "@/lib/utils";

function DeltaSpan({ pct }: { pct: number }) {
  return (
    <span className={`delta ${deltaClass(pct)}`}>
      <span className="delta-tri">{deltaTri(pct)}</span>
      {fmtPct(pct)}
    </span>
  );
}

const TRADES = [
  { entry: "2020-11", exit: "2021-02", capital: "EUR 1.00M", pnl: 8.4, hold: "3M" },
  { entry: "2021-02", exit: "2021-05", capital: "EUR 1.08M", pnl: 14.2, hold: "3M" },
  { entry: "2021-05", exit: "2021-08", capital: "EUR 1.24M", pnl: 11.8, hold: "3M" },
  { entry: "2021-08", exit: "2021-11", capital: "EUR 1.38M", pnl: -4.7, hold: "3M" },
  { entry: "2022-02", exit: "2022-05", capital: "EUR 1.31M", pnl: -12.4, hold: "3M" },
  { entry: "2022-05", exit: "2022-08", capital: "EUR 1.15M", pnl: 7.4, hold: "3M" },
  { entry: "2023-02", exit: "2023-05", capital: "EUR 1.42M", pnl: 18.7, hold: "3M" },
  { entry: "2024-02", exit: "2024-05", capital: "EUR 2.18M", pnl: 22.3, hold: "3M" },
  { entry: "2024-08", exit: "2024-11", capital: "EUR 2.81M", pnl: 14.4, hold: "3M" },
  { entry: "2025-05", exit: "2025-08", capital: "EUR 3.18M", pnl: 8.6, hold: "3M" },
];

export function TradePage() {
  const [direction, setDirection] = useState<"LONG" | "SHORT">("LONG");
  const [rebalance, setRebalance] = useState<"Quarterly" | "Yearly">("Quarterly");
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<unknown>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const initChart = async () => {
      const { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip } = await import("chart.js");
      Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);
      if (chartInstance.current) (chartInstance.current as { destroy: () => void }).destroy();
      const getCssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
      const labels = monthlyLabels(60);
      const portfolio = synthSeries(100, 347, 60, 14);
      const sp500 = synthSeries(100, 178, 60, 8);
      const gold = synthSeries(100, 145, 60, 6);
      const btc = synthSeries(100, 320, 60, 25);
      chartInstance.current = new Chart(chartRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [
            { label: "Portfolio", data: portfolio, borderColor: getCssVar("--accent-amber"), backgroundColor: "transparent", borderWidth: 1.6, tension: 0.05, pointRadius: 0, pointHoverRadius: 4 },
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
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Research <span className="sep">/</span> Backtest</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Trade Simulator</h1>
          <div className="caption mt-4">Simulate cross-segment positions vs equity, bond, commodity benchmarks</div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Save scenario</button>
          <button className="tool-btn active">Run backtest</button>
        </div>
      </div>

      <div className="grid-3-2 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Portfolio Backtest · 5Y</div><div className="panel-meta">Long Ultra-C · Short Street &amp; Urban</div></div>
          <div className="panel-body">
            <div style={{ position: "relative", height: 340 }}>
              <canvas ref={chartRef} />
            </div>
            <div className="legend-row">
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--accent-amber)" }} />Simulated portfolio</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--tag-observed)" }} />S&amp;P 500</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--color-warning)" }} />Gold</span>
              <span className="legend-item"><span className="legend-swatch" style={{ background: "var(--tag-interpreted)" }} />BTC</span>
            </div>
          </div>
        </div>
        <div>
          <div className="panel mb-16">
            <div className="panel-head"><div className="panel-title">Position Configurator</div><div className="panel-meta">Edit to re-run</div></div>
            <div className="panel-body" style={{ padding: "8px 14px" }}>
              <div className="form-row">
                <label>Direction</label>
                <div className="toggle-group">
                  {(["LONG", "SHORT"] as const).map((d) => (
                    <button key={d} className={`toggle-btn${direction === d ? " active" : ""}`} onClick={() => setDirection(d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label>Segment</label>
                <select className="form-select">
                  <option>BART ULTRA-CONTEMPORARY</option>
                  <option>BART BLUE CHIP</option>
                  <option>BART MODERN MASTERS</option>
                  <option>BART PHOTOGRAPHY</option>
                  <option>BART STREET &amp; URBAN</option>
                </select>
              </div>
              <div className="form-row"><label>Allocation</label><input className="form-input" defaultValue="100%" /></div>
              <div className="form-row"><label>Period</label><input className="form-input" defaultValue="2020-11 to 2025-11" /></div>
              <div className="form-row"><label>Capital</label><input className="form-input" defaultValue="EUR 1,000,000" /></div>
              <div className="form-row">
                <label>Rebalance</label>
                <div className="toggle-group">
                  {(["Quarterly", "Yearly"] as const).map((r) => (
                    <button key={r} className={`toggle-btn${rebalance === r ? " active" : ""}`} onClick={() => setRebalance(r)}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head"><div className="panel-title">Performance Metrics</div></div>
            <div className="panel-body" style={{ padding: "8px 14px" }}>
              <div className="form-row"><label>Total Return</label><span className="mono text-up">+247.3%</span></div>
              <div className="form-row"><label>CAGR</label><span className="mono text-up">+28.4%</span></div>
              <div className="form-row"><label>Volatility</label><span className="mono">31.4%</span></div>
              <div className="form-row"><label>Sharpe</label><span className="mono">0.82</span></div>
              <div className="form-row"><label>Max Drawdown</label><span className="mono text-down">-22.7%</span></div>
              <div className="form-row"><label>Calmar</label><span className="mono">1.25</span></div>
              <div className="form-row"><label>Vs S&amp;P 500</label><span className="mono text-up">+1690bp</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Correlation Matrix</div><div className="panel-meta">Trailing 5Y · monthly returns</div></div>
          <div className="panel-body">
            <div className="corr-matrix" style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}>
              <div className="corr-cell head" />
              <div className="corr-cell head">BUC</div><div className="corr-cell head">BBC</div><div className="corr-cell head">SPX</div><div className="corr-cell head">GLD</div><div className="corr-cell head">BTC</div>
              <div className="corr-cell row-head">BUC</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 60%, transparent)", color: "#0A0A0B" }}>1.00</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 18%, transparent)" }}>0.42</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 8%, transparent)" }}>0.21</div>
              <div className="corr-cell">0.04</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--color-down) 12%, transparent)" }}>-0.18</div>
              <div className="corr-cell row-head">BBC</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 18%, transparent)" }}>0.42</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 60%, transparent)", color: "#0A0A0B" }}>1.00</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 14%, transparent)" }}>0.34</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 10%, transparent)" }}>0.27</div>
              <div className="corr-cell">0.08</div>
              <div className="corr-cell row-head">SPX</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 8%, transparent)" }}>0.21</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 14%, transparent)" }}>0.34</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 60%, transparent)", color: "#0A0A0B" }}>1.00</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--color-down) 8%, transparent)" }}>-0.12</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 22%, transparent)" }}>0.51</div>
              <div className="corr-cell row-head">GLD</div>
              <div className="corr-cell">0.04</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 10%, transparent)" }}>0.27</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--color-down) 8%, transparent)" }}>-0.12</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 60%, transparent)", color: "#0A0A0B" }}>1.00</div>
              <div className="corr-cell">0.06</div>
              <div className="corr-cell row-head">BTC</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--color-down) 12%, transparent)" }}>-0.18</div>
              <div className="corr-cell">0.08</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 22%, transparent)" }}>0.51</div>
              <div className="corr-cell">0.06</div>
              <div className="corr-cell" style={{ background: "color-mix(in srgb, var(--accent-amber) 60%, transparent)", color: "#0A0A0B" }}>1.00</div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Simulated Trades</div><div className="panel-meta">Quarterly rebalance · 10 visible</div></div>
          <div className="panel-body flush">
            <table className="dtable">
              <thead><tr><th>Entry</th><th>Exit</th><th className="num">Capital</th><th className="num">P&amp;L</th><th className="num">Hold</th></tr></thead>
              <tbody>
                {TRADES.map((t, i) => (
                  <tr key={i}>
                    <td className="mono">{t.entry}</td>
                    <td className="mono">{t.exit}</td>
                    <td className="num">{t.capital}</td>
                    <td className="num"><DeltaSpan pct={t.pnl} /></td>
                    <td className="num muted">{t.hold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
