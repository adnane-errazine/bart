"use client";

import { WATCHLIST } from "@/lib/data";
import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";

interface Props { onNavigate: (r: string, p?: string) => void; }

export function WatchlistPage({ onNavigate }: Props) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Personal</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Watchlist</h1>
          <div className="caption mt-4">{WATCHLIST.length} works tracked across segments</div>
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
                <th>Work</th>
                <th>Segment</th>
                <th className="num">Added Price</th>
                <th className="num">Fair Value</th>
                <th className="num">Δ FV</th>
                <th className="num">BART</th>
              </tr>
            </thead>
            <tbody>
              {WATCHLIST.map((w) => (
                <tr key={w.artworkId} className="clickable" onClick={() => onNavigate("artwork", w.artworkId)}>
                  <td>
                    <div className="row-icon">
                      <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(w.artworkId.length) }} />
                      <div>
                        <div className="row-name">{w.title.slice(0, 36)}</div>
                        <div className="row-sub">{w.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="muted">{w.segment}</td>
                  <td className="num">{fmtEur(w.addedPrice, true)}</td>
                  <td className="num">{fmtEur(w.currentFV, true)}</td>
                  <td className="num">
                    <span className={`delta ${deltaClass(w.deltaFV)}`}>
                      <span className="delta-tri">{deltaTri(w.deltaFV)}</span>{fmtPct(w.deltaFV)}
                    </span>
                  </td>
                  <td className="num text-amber">{w.bartScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
