"use client";

import { WATCHLIST, ARTWORKS } from "@/lib/data";
import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";

interface Props { onNavigate: (r: string, p?: string) => void; }

export function WatchlistPage({ onNavigate }: Props) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Personal</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Watchlist</h1>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Export</button>
          <button className="tool-btn">Add Work</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th>Work</th><th>Segment</th>
                <th className="num">Added Price</th>
                <th className="num">Fair Value</th>
                <th className="num">Δ FV</th>
                <th className="num">Confidence</th>
                <th className="num">Liquidity</th>
                <th className="num">BART</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map((w) => {
                const a = ARTWORKS.find((x) => x.id === w.artworkId);
                if (!a) return null;
                return (
                  <tr key={w.artworkId} className="clickable" onClick={() => onNavigate("artwork", a.id)}>
                    <td>
                      <div className="row-icon">
                        <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(a.id.length) }} />
                        <div>
                          <div className="row-name">{a.title.slice(0, 30)}</div>
                          <div className="row-sub">{a.artist} · {a.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{a.segment}</td>
                    <td className="num">{fmtEur(w.addedPrice, true)}</td>
                    <td className="num">{fmtEur(w.currentFV, true)}</td>
                    <td className="num">
                      <span className={`delta ${deltaClass(w.deltaFV)}`}>
                        <span className="delta-tri">{deltaTri(w.deltaFV)}</span>{fmtPct(w.deltaFV)}
                      </span>
                    </td>
                    <td className="num">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <span className="inline-bar"><span className="inline-bar-fill" style={{ width: `${a.confidence}%` }} /></span>
                        <span className="mono" style={{ fontSize: 11 }}>{a.confidence}</span>
                      </div>
                    </td>
                    <td className="num">
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                        <span className="inline-bar"><span className="inline-bar-fill" style={{ width: `${a.liquidity}%` }} /></span>
                        <span className="mono" style={{ fontSize: 11 }}>{a.liquidity}</span>
                      </div>
                    </td>
                    <td className="num text-amber">{w.bartScore}</td>
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
