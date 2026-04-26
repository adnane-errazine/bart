"use client";

import { fmtEur, fmtPct, deltaClass, deltaTri, synthPainting } from "@/lib/utils";
import { usePortfolio, type AllocationSlice } from "@/lib/portfolio";

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

function DonutSVG({ data, size = 180 }: { data: AllocationSlice[]; size?: number }) {
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const total = data.reduce((s, d) => s + d.pct, 0);

  if (data.length === 0 || total <= 0) {
    return (
      <svg className="donut" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="var(--bg-tertiary, #1a1a1a)" />
        <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--bg-secondary)" />
      </svg>
    );
  }

  if (data.length === 1) {
    return (
      <svg className="donut" viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={data[0].color} stroke="var(--bg-secondary)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={r * 0.6} fill="var(--bg-secondary)" />
      </svg>
    );
  }

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
  const { rows, loading, totals, allocation, averages, concentration, remove } = usePortfolio();

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Portfolio <span className="sep">/</span> Pro Tier <span className="sep">/</span> {rows.length} holding{rows.length !== 1 ? "s" : ""}</div>
          <h1 className="h1" style={{ marginTop: 6 }}>My Portfolio</h1>
        </div>
        <div className="page-header-right">
          <button className="tool-btn" onClick={() => onNavigate("artwork", "__list")}>Add holding</button>
          <button className="tool-btn">IFRS 13 export</button>
          <button className="tool-btn">Rebalance</button>
        </div>
      </div>

      <div className="signature-metrics mb-24">
        <div className="sig-cell">
          <div className="metric-label">TOTAL VALUE</div>
          <div className="metric-value lg">{fmtEur(totals.totalValue, true)}</div>
          <div className="metric-sub"><DeltaSpan pct={totals.pnlPct} /> vs cost basis</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">P&amp;L PROXY</div>
          <div className="metric-value">{fmtEur(totals.pnl, true)}</div>
          <div className="metric-sub">unrealized</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">CONFIDENCE AVG</div>
          <div className="metric-value">{averages.confidence ? averages.confidence.toFixed(0) : "—"}</div>
          <div className="metric-band">{scoreDots(averages.confidence)}</div>
        </div>
        <div className="sig-cell">
          <div className="metric-label">LIQUIDITY AVG</div>
          <div className="metric-value">{averages.liquidity ? averages.liquidity.toFixed(0) : "—"}</div>
          <div className="metric-band">{scoreDots(averages.liquidity)}</div>
        </div>
      </div>

      <div className="grid-2 mb-24">
        <div className="panel">
          <div className="panel-head"><div className="panel-title">Allocation by Segment</div><div className="panel-meta">Live</div></div>
          <div className="panel-body">
            <div className="donut-wrap">
              <DonutSVG data={allocation} size={180} />
              <div className="donut-legend">
                {allocation.length === 0 ? (
                  <div className="caption">No allocation yet.</div>
                ) : allocation.map((s) => (
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
              <div>
                <div className="metric-label">CONCENTRATION SINGLE</div>
                <div className="mono" style={{ fontSize: 18 }}>{concentration.single.toFixed(1)}%</div>
                <div className="caption mt-4">{concentration.singleSegment}</div>
              </div>
              <div>
                <div className="metric-label">CONCENTRATION TOP 3</div>
                <div className="mono" style={{ fontSize: 18 }}>{concentration.top3.toFixed(1)}%</div>
                <div className="caption mt-4">{concentration.top3Segments}</div>
              </div>
            </div>
            <div className="rule-block mt-16">
              <strong>Rebalance suggestion.</strong> Reduce exposure to the dominant segment ({concentration.singleSegment}, {concentration.single.toFixed(1)}%) and diversify into segments under-represented in the current mix to lower volatility-weighted concentration.
            </div>
            <div className="mt-16">
              <div className="metric-label">LIQUIDITY MIX</div>
              <div className="grid-2 mt-4" style={{ gap: 8 }}>
                <div><div className="caption">High (&gt;70)</div><div className="mono">{rows.filter((r) => (r.artwork?.liquidity ?? 0) > 70).length}</div></div>
                <div><div className="caption">Medium (40–70)</div><div className="mono">{rows.filter((r) => { const l = r.artwork?.liquidity ?? 0; return l >= 40 && l <= 70; }).length}</div></div>
                <div><div className="caption">Low (&lt;40)</div><div className="mono text-down">{rows.filter((r) => { const l = r.artwork?.liquidity ?? 0; return l > 0 && l < 40; }).length}</div></div>
                <div><div className="caption">Untracked</div><div className="mono">{rows.filter((r) => !r.artwork?.liquidity).length}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel mb-24">
        <div className="panel-head"><div className="panel-title">Holdings</div><div className="panel-meta">{loading ? "Loading…" : "Click to open work"}</div></div>
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th>Work</th><th>Segment</th><th className="num">Acquired</th>
                <th className="num">Fair Value</th><th className="num">P&amp;L</th><th className="num">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="caption" style={{ padding: "20px 16px" }}>Loading holdings…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="caption" style={{ padding: "20px 16px" }}>No holdings yet.</td></tr>
              ) : rows.map((row) => {
                const id = row.holding.id;
                const title = row.artwork?.title ?? id;
                const artist = row.artwork?.artist_name ?? "—";
                const segment = row.artwork?.category ?? "—";
                return (
                  <tr key={id} className="clickable" onClick={() => onNavigate("artwork", id)}>
                    <td>
                      <div className="row-icon">
                        <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(id.length) }} />
                        <div>
                          <div className="row-name">{title.slice(0, 32)}</div>
                          <div className="row-sub">{artist}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{segment}</td>
                    <td className="num">{fmtEur(row.holding.acquired_eur, true)}</td>
                    <td className="num">{row.current_eur > 0 ? fmtEur(row.current_eur, true) : "—"}</td>
                    <td className="num">{row.current_eur > 0 ? <DeltaSpan pct={row.pnl_pct} /> : <span className="text-tertiary">—</span>}</td>
                    <td className="num">
                      <button
                        className="tool-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          remove(id);
                        }}
                      >
                        Remove
                      </button>
                    </td>
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
