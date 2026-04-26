"use client";

import { useEffect, useState } from "react";
import { AUCTIONS, RECENT_RESULTS } from "@/lib/data";

import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";
import { useIndices } from "@/lib/useIndices";
import { api, type DailyBrief } from "@/lib/api";
import { useWatchlistArtworks } from "@/lib/watchlist";
import { usePortfolio } from "@/lib/portfolio";

interface Props { onNavigate: (route: string, param?: string) => void; }

export function HomePage({ onNavigate }: Props) {
  const { indices: INDICES } = useIndices();
  const { artworks: watchlistArtworks, loading: watchlistLoading } = useWatchlistArtworks(8);
  const { rows: portfolioRows, totals: portfolioTotals, averages: portfolioAverages } = usePortfolio();
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefError, setBriefError] = useState(false);
  // Computed client-side after mount to avoid SSR/CSR hydration mismatch.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(tick);
  }, []);

  const weekday = now ? now.toLocaleDateString("en-US", { weekday: "long" }) : "";
  const dateStr = now ? now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const greetingPrefix = now ? (now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening") : "Welcome";

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
            {weekday || "—"} <span className="sep">/</span> {dateStr || "—"} <span className="sep">/</span> Closing 18:00 CET
          </div>
          <h1 className="h1" style={{ marginTop: 6 }}>{greetingPrefix}, Jordan Belfort.</h1>
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
              <div className="metric-value lg">{fmtEur(portfolioTotals.totalValue, true)}</div>
              <div className="metric-sub">
                <span className={`delta ${deltaClass(portfolioTotals.pnlPct)}`}>
                  <span className="delta-tri">{deltaTri(portfolioTotals.pnlPct)}</span>{fmtPct(portfolioTotals.pnlPct)}
                </span>
                {" "}<span className="text-tertiary">vs cost basis</span>
              </div>
            </div>
            <div className="grid-2 mt-16">
              {[
                { label: "P&L PROXY", val: fmtEur(portfolioTotals.pnl, true) },
                { label: "HOLDINGS", val: `${portfolioRows.length} work${portfolioRows.length !== 1 ? "s" : ""}` },
                { label: "CONFIDENCE AVG", val: portfolioAverages.confidence ? portfolioAverages.confidence.toFixed(0) : "—" },
                { label: "LIQUIDITY AVG", val: portfolioAverages.liquidity ? portfolioAverages.liquidity.toFixed(0) : "—" },
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
            <div className="panel-meta">{watchlistArtworks.length} works tracked</div>
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
                {watchlistLoading ? (
                  <tr><td colSpan={5} className="caption">Loading watchlist…</td></tr>
                ) : watchlistArtworks.length === 0 ? (
                  <tr><td colSpan={5} className="caption">No works tracked.</td></tr>
                ) : watchlistArtworks.map((w) => {
                  const segShort = w.category.replace("Ultra-Contemporary", "Ultra-C").replace("Modern Masters", "Modern");
                  const fairValue = w.fair_value_mid_eur ?? w.last_sale?.price_eur ?? 0;
                  const lastPrice = w.last_sale?.price_eur ?? 0;
                  const delta = lastPrice > 0 && fairValue > 0 ? ((fairValue / lastPrice) - 1) * 100 : 0;
                  return (
                    <tr key={w.id} className="clickable" onClick={() => onNavigate("artwork", w.id)}>
                      <td>
                        <div className="row-icon">
                          <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(w.id.length) }} />
                          <div>
                            <div className="row-name">{w.title.slice(0, 28)}</div>
                            <div className="row-sub">{w.artist_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="muted">{segShort}</td>
                      <td className="num">{fairValue ? fmtEur(fairValue, true) : "—"}</td>
                      <td className="num">
                        {lastPrice > 0 && fairValue > 0 ? (
                          <span className={`delta ${deltaClass(delta)}`}>
                            <span className="delta-tri">{deltaTri(delta)}</span>{fmtPct(delta)}
                          </span>
                        ) : <span className="text-tertiary">—</span>}
                      </td>
                      <td className="num text-amber">{w.bart_score?.toFixed(0) ?? "—"}</td>
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
