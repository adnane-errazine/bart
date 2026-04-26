"use client";

import { PORTFOLIO } from "@/lib/data";
import { fmtEur, fmtPct, deltaClass, deltaTri, synthPainting } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";

function DeltaSpan({ pct }: { pct: number }) {
  return (
    <span className={`delta ${deltaClass(pct)}`}>
      <span className="delta-tri">{deltaTri(pct)}</span>
      {fmtPct(pct)}
    </span>
  );
}

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

function DonutSVG({ data, size = 180 }: { data: typeof PORTFOLIO.allocation; size?: number }) {
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((s, d) => s + d.pct, 0);
  let acc = 0;
  const segs = data.map((d, i) => {
    const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
    acc += d.pct;
    const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return (
      <path
        key={i}
        d={`M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`}
        fill={d.color}
        stroke="var(--bg-secondary)"
        strokeWidth={2}
      />
    );
  });

  return (
    <svg className="donut" viewBox={`0 0 ${size} ${size}`}>
      {segs}
      <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--bg-secondary)" />
    </svg>
  );
}

interface Props {
  onNavigate: (r: string, param?: string) => void;
}

export function PortfolioPage({ onNavigate }: Props) {
  const p = PORTFOLIO;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Portfolio <span className="sep">/</span> Pro Tier <span className="sep">/</span> {p.holdings.length} holdings</div>
          <h1 className="h1" style={{ marginTop: 6 }}>My Portfolio</h1>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Add holding</button>
          <button className="tool-btn">IFRS 13 export</button>
          <button className="tool-btn">Rebalance</button>
        </div>
      </div>

      <div className="signature-metrics mb-24">
        <div className="sig-cell">
          <div className="metric-label">TOTAL VALUE</div>
          <div className="metric-value lg">{fmtEur(p.totalValue, true)}</div>
          <div className="metric-sub"><DeltaSpan pct={p.pnlPct} /> vs cost basis</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">P&amp;L PROXY</div>
          <div className="metric-value">{fmtEur(p.pnl, true)}</div>
          <div className="metric-sub">unrealized</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">CONFIDENCE AVG</div>
          <div className="metric-value">82</div>
          <div className="metric-band">{scoreDots(82)}</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">LIQUIDITY AVG</div>
          <div className="metric-value">61</div>
          <div className="metric-band">{scoreDots(61)}</div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Allocation by Segment</div><div className="panel-meta">Live</div></div>
          <div className="panel-body">
            <div className="donut-wrap">
              <DonutSVG data={p.allocation} size={180} />
              <div className="donut-legend">
                {p.allocation.map((s) => (
                  <div key={s.segment} className="donut-legend-row">
                    <span className="swatch" style={{ background: s.color }} />
                    <span className="lbl">{s.segment}</span>
                    <span className="pct">{s.pct.toFixed(1)}%</span>
                    <span className="vl">{fmtEur(s.value, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Concentration &amp; Liquidity Risk</div></div>
          <div className="panel-body">
            <div className="grid-2">
              <div><div className="metric-label">CONCENTRATION SINGLE</div><div className="mono" style={{ fontSize: 18 }}>33.7%</div><div className="caption mt-4">Modern Masters (Kusama)</div></div>
              <div><div className="metric-label">CONCENTRATION TOP 3</div><div className="mono" style={{ fontSize: 18 }}>79.6%</div><div className="caption mt-4">Modern + Photo + UC</div></div>
            </div>
            <div className="rule-block mt-16">
              <strong>Rebalance suggestion.</strong> Reduce Photography exposure (-12pp) and increase Blue Chip (+10pp) to lower volatility-weighted concentration. Current Sharpe 0.74, target 0.95.
            </div>
            <div className="mt-16">
              <div className="metric-label">LIQUIDITY MIX</div>
              <div className="grid-2 mt-4" style={{ gap: 8 }}>
                <div><div className="caption">High (&gt;70)</div><div className="mono">31%</div></div>
                <div><div className="caption">Medium (40–70)</div><div className="mono">42%</div></div>
                <div><div className="caption">Low (&lt;40)</div><div className="mono text-down">21%</div></div>
                <div><div className="caption">Reserve</div><div className="mono">6%</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel mb-24">
        <div className="panel-head"><div className="panel-title">Holdings</div><div className="panel-meta">Click to open work</div></div>
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th>Work</th><th>Segment</th><th className="num">Acquired</th>
                <th className="num">Fair Value</th><th className="num">P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {p.holdings.map((h) => {
                const pnl = h.currentFV - h.acquired;
                const pnlPct = (pnl / h.acquired) * 100;
                return (
                  <tr key={h.artworkId} className="clickable" onClick={() => onNavigate("artwork", h.artworkId)}>
                    <td>
                      <div className="row-icon">
                        <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(h.artworkId.length) }} />
                        <div>
                          <div className="row-name">{h.title.slice(0, 32)}</div>
                          <div className="row-sub">{h.artist}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{h.segment}</td>
                    <td className="num">{fmtEur(h.acquired, true)}</td>
                    <td className="num">{fmtEur(h.currentFV, true)}</td>
                    <td className="num"><DeltaSpan pct={pnlPct} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
