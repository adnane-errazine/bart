"use client";

import { useEffect, useState } from "react";
import { WATCHLIST, PORTFOLIO, AUCTIONS, RECENT_RESULTS } from "@/lib/data";

import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";
import { useIndices } from "@/lib/useIndices";
import { api, type DailyBrief } from "@/lib/api";

interface Props { onNavigate: (route: string, param?: string) => void; }

export function HomePage({ onNavigate }: Props) {
  const { indices: INDICES } = useIndices();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefError, setBriefError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refreshBrief() {
      try {
        const nextBrief = await api.dailyBrief();
        if (!cancelled) {
          setBrief(nextBrief);
          setBriefError(false);
        }
      } catch {
        if (!cancelled) setBriefError(true);
      }
    }

    refreshBrief();
    const timer = window.setInterval(refreshBrief, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);
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
          const trendDir = idx.change30d > 0 ? "up" : "down";
          return (
            <div key={idx.id} className="index-card" onClick={() => onNavigate("indices")}>
              <div className="index-card-head">
                <div className="index-card-name">{idx.short}</div>
                <div className="caption mono">{idx.method.slice(0, 3).toUpperCase()}</div>
              </div>
              <div className="index-card-value">{idx.value.toFixed(2)}</div>
              <div className="caption">{idx.name.replace("BART ", "")}</div>
              <div className="index-card-meta">
                <span className={`delta ${deltaClass(idx.change30d)}`}>
                  <span className="delta-tri">{deltaTri(idx.change30d)}</span>
                  {fmtPct(idx.change30d)}
                </span>
                <Sparkline values={idx.spark30d} direction={trendDir} />
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
            <div className="panel-meta">
              {brief ? `Mis à jour ${brief.updated_at}` : briefError ? "Hors ligne" : "Chargement…"}
            </div>
          </div>
          <div className="daily-brief">
            <div className="daily-brief-intro">
              {briefError && !brief ? "Le brief n'est pas disponible pour le moment." : brief?.intro ?? "Chargement du brief…"}
            </div>
            {brief && brief.bullets.length > 0 && (
              <ul className="brief-bullets">
                {brief.bullets.map((b, i) => (
                  <li key={i}>
                    <span className="brief-bullet-text">
                      <strong>{b.artist.toUpperCase()}</strong>
                      {" "}
                      <span className={`delta ${b.move > 0 ? "up" : "down"}`}>
                        {b.move > 0 ? "+" : ""}{b.move}%
                      </span>
                      {" — "}
                      {b.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
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
                  const segShort = w.segment.replace("Ultra-Contemporary", "Ultra-C").replace("Modern Masters", "Modern");
                  return (
                    <tr key={w.artworkId} className="clickable" onClick={() => onNavigate("artwork", w.artworkId)}>
                      <td>
                        <div className="row-icon">
                          <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(w.artworkId.length) }} />
                          <div>
                            <div className="row-name">{w.title.slice(0, 28)}</div>
                            <div className="row-sub">{w.artist}</div>
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
                {(brief?.top_movers ?? []).map((m) => (
                  <tr key={m.artist}>
                    <td><div className="row-name">{m.artist}</div><div className="row-sub">{m.segment}</div></td>
                    <td className="num">
                      <span className={`delta ${deltaClass(m.move)}`}>
                        <span className="delta-tri">{deltaTri(m.move)}</span>{fmtPct(m.move)}
                      </span>
                    </td>
                    <td className="muted">{m.driver.slice(0, 50)}</td>
                  </tr>
                ))}
                {!brief && (
                  <tr><td colSpan={3} className="caption">Chargement…</td></tr>
                )}
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
