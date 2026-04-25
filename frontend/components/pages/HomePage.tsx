"use client";

import { INDICES, ARTWORKS, WATCHLIST, PORTFOLIO, AUCTIONS, RECENT_RESULTS, TOP_MOVERS } from "@/lib/data";
import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";

interface Props { onNavigate: (route: string, param?: string) => void; }

export function HomePage({ onNavigate }: Props) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">
            Tuesday <span className="sep">/</span> Nov 11, 2025 <span className="sep">/</span> Closing 18:00 CET
          </div>
          <h1 className="h1" style={{ marginTop: 6 }}>Good morning, Gabriel.</h1>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Export PDF</button>
          <button className="tool-btn">Customize</button>
        </div>
      </div>

      {/* Index Strip */}
      <div className="index-strip">
        {INDICES.map((idx) => {
          const dir = idx.change1d > 0 ? "up" : "down";
          const cls = `delta ${dir}`;
          return (
            <div key={idx.id} className="index-card" onClick={() => onNavigate("indices")}>
              <div className="index-card-head">
                <div className="index-card-name">{idx.short}</div>
                <div className="caption mono">{idx.method.slice(0, 3).toUpperCase()}</div>
              </div>
              <div className="index-card-value">{idx.value.toFixed(2)}</div>
              <div className="caption">{idx.name.replace("BART ", "")}</div>
              <div className="index-card-meta">
                <span className={cls}>
                  <span className="delta-tri">{deltaTri(idx.change1d)}</span>
                  {fmtPct(idx.change1d)}
                </span>
                <Sparkline values={idx.spark30d} direction={dir} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Brief + Portfolio */}
      <div className="grid-2-1 mb-24">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Daily Brief</div>
            <div className="panel-meta">Curator + Signals · 14m ago</div>
          </div>
          <div className="daily-brief">
            <div className="daily-brief-intro">
              Le marché ouvre la semaine sur un signal de force concentré sur l&apos;Ultra-Contemporary, porté par une vente Christie&apos;s NY exceptionnelle (Bull, Quarles) et un flux acheteur asiatique sur le Street segment. Les indices Blue Chip et Modern restent en consolidation latérale.
            </div>
            <ul className="brief-bullets">
              {[
                <><strong>BART ULTRA-CONTEMPORARY</strong> +<span className="mono">1.42%</span> — <em>Lucy Bull</em> Quaver lot adjudicated <span className="mono">EUR 450k</span> at Christie&apos;s NY (+18% est.)</>,
                <><strong>BART STREET & URBAN</strong> +<span className="mono">2.18%</span> driven by Invader Hong Kong secondary block, Confidence downgraded High to Medium</>,
                <><strong>Whitney Biennial 2026</strong> shortlist leaked — 14 tracked artists incl. Quarles, Toor, Boafo. Historical inclusion driver +20–40% on 6M post-event window</>,
                <><strong>Pinault Collection</strong> dispatching 4 Boafo paintings to Bourse de Commerce Q1 2026 rotation</>,
                <><strong>Anna Weyant</strong> sell-through degraded -22pts trailing 90D, third unsold lot — Ultra-Contemporary downside watchlist alerted</>,
              ].map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Portfolio Snapshot</div>
            <div className="panel-meta">Live</div>
          </div>
          <div className="panel-body">
            <div className="metric flush">
              <div className="metric-label">TOTAL VALUE</div>
              <div className="metric-value lg">{fmtEur(PORTFOLIO.totalValue, true)}</div>
              <div className="metric-sub">
                <span className={`delta ${deltaClass(PORTFOLIO.pnlPct)}`}>
                  <span className="delta-tri">{deltaTri(PORTFOLIO.pnlPct)}</span>{fmtPct(PORTFOLIO.pnlPct)}
                </span>
                {" "}<span className="text-tertiary">vs cost basis</span>
              </div>
            </div>
            <div className="grid-2 mt-16">
              {[
                { label: "P&L PROXY", val: fmtEur(PORTFOLIO.pnl, true) },
                { label: "HOLDINGS", val: `${PORTFOLIO.holdings.length} works` },
                { label: "CONFIDENCE AVG", val: "82" },
                { label: "LIQUIDITY AVG", val: "61" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="metric-label">{s.label}</div>
                  <div className="mono" style={{ fontSize: 14 }}>{s.val}</div>
                </div>
              ))}
            </div>
            <button className="tool-btn w-full mt-16" style={{ display: "block", textAlign: "center" }}
              onClick={() => onNavigate("portfolio")}>
              Open Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Watchlist + Movers */}
      <div className="grid-2-1 mb-24">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Watchlist Pulse</div>
            <div className="panel-meta">8 works tracked</div>
          </div>
          <div className="panel-body flush">
            <table className="dtable">
              <thead>
                <tr>
                  <th>Work</th><th>Segment</th>
                  <th className="num">Fair Value</th>
                  <th className="num">Delta vs Add</th>
                  <th className="num">BART</th>
                </tr>
              </thead>
              <tbody>
                {WATCHLIST.map((w) => {
                  const a = ARTWORKS.find((x) => x.id === w.artworkId);
                  if (!a) return null;
                  const segShort = a.segment.replace("Ultra-Contemporary", "Ultra-C").replace("Modern Masters", "Modern").replace("Street & Urban", "Street");
                  return (
                    <tr key={w.artworkId} className="clickable" onClick={() => onNavigate("artwork", a.id)}>
                      <td>
                        <div className="row-icon">
                          <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(a.id.length) }} />
                          <div>
                            <div className="row-name">{a.title.slice(0, 28)}</div>
                            <div className="row-sub">{a.artist}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted">{segShort}</td>
                      <td className="num">{fmtEur(w.currentFV, true)}</td>
                      <td className="num">
                        <span className={`delta ${deltaClass(w.deltaFV)}`}>
                          <span className="delta-tri">{deltaTri(w.deltaFV)}</span>{fmtPct(w.deltaFV)}
                        </span>
                      </td>
                      <td className="num text-amber">{w.bartScore}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Top Movers · 7D</div>
            <div className="panel-meta">Cross-segment</div>
          </div>
          <div className="panel-body flush">
            <table className="dtable">
              <thead><tr><th>Artist</th><th className="num">Move</th><th>Driver</th></tr></thead>
              <tbody>
                {TOP_MOVERS.map((m) => (
                  <tr key={m.artist}>
                    <td><div className="row-name">{m.artist}</div><div className="row-sub">{m.segment}</div></td>
                    <td className="num">
                      <span className={`delta ${deltaClass(m.move)}`}>
                        <span className="delta-tri">{deltaTri(m.move)}</span>{fmtPct(m.move)}
                      </span>
                    </td>
                    <td className="muted">{m.driver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Auctions + Results */}
      <div className="grid-1-2 mb-24">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Upcoming Auctions</div>
            <div className="panel-meta">Next 30 days</div>
          </div>
          <div className="panel-body flush">
            <table className="dtable">
              <thead>
                <tr><th>Date</th><th>Sale</th><th className="num">Lots</th><th className="num">Est.</th><th className="num">Tracked</th></tr>
              </thead>
              <tbody>
                {AUCTIONS.map((a) => (
                  <tr key={a.date + a.house}>
                    <td className="mono text-amber" style={{ width: 60 }}>{a.date}</td>
                    <td><div className="row-name">{a.house}</div><div className="row-sub">{a.sale}</div></td>
                    <td className="num muted">{a.lots}</td>
                    <td className="num">{a.est}</td>
                    <td className="num text-amber">{a.tracked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Latest Auction Results</div>
            <div className="panel-meta">Last 7 days</div>
          </div>
          <div className="panel-body flush">
            <table className="dtable">
              <thead>
                <tr><th>Date</th><th>Lot</th><th className="num">Estimate</th><th className="num">Hammer</th><th className="num">Delta</th></tr>
              </thead>
              <tbody>
                {RECENT_RESULTS.map((r) => (
                  <tr key={r.date + r.artwork}>
                    <td className="mono muted" style={{ width: 60 }}>{r.date}</td>
                    <td><div className="row-name">{r.artwork}</div><div className="row-sub">{r.house}</div></td>
                    <td className="num muted">{r.est}</td>
                    <td className="num">
                      {r.bought_in
                        ? <span className="text-down mono">BOUGHT IN</span>
                        : <span className="mono">{fmtEur(r.sold, true)}</span>}
                    </td>
                    <td className="num">
                      {r.bought_in ? <span className="text-tertiary">—</span> : (
                        <span className={`delta ${deltaClass(r.delta)}`}>
                          <span className="delta-tri">{deltaTri(r.delta)}</span>{fmtPct(r.delta)}
                        </span>
                      )}
                    </td>
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
