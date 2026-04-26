"use client";

import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";
import { useWatchlistArtworks } from "@/lib/watchlist";

interface Props { onNavigate: (r: string, p?: string) => void; }

function fairValue(artwork: { fair_value_mid_eur?: number; last_sale?: { price_eur: number } }) {
  return artwork.fair_value_mid_eur ?? artwork.last_sale?.price_eur ?? 0;
}

function lastPrice(artwork: { last_sale?: { price_eur: number } }) {
  return artwork.last_sale?.price_eur ?? 0;
}

export function WatchlistPage({ onNavigate }: Props) {
  const { artworks, loading, remove } = useWatchlistArtworks();

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Personal</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Watchlist</h1>
          <div className="caption mt-4">{artworks.length} work{artworks.length !== 1 ? "s" : ""} tracked from the live artwork dataset</div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn" onClick={() => onNavigate("artwork")}>Add Work</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th>Work</th>
                <th>Segment</th>
                <th className="num">Last Sale</th>
                <th className="num">Fair Value</th>
                <th className="num">Δ FV</th>
                <th className="num">BART</th>
                <th className="num">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="caption" style={{ padding: "20px 16px" }}>Loading watchlist…</td></tr>
              ) : artworks.length === 0 ? (
                <tr><td colSpan={7} className="caption" style={{ padding: "20px 16px" }}>No works in your watchlist.</td></tr>
              ) : artworks.map((artwork) => {
                const last = lastPrice(artwork);
                const fv = fairValue(artwork);
                const delta = last > 0 ? ((fv / last) - 1) * 100 : 0;

                return (
                  <tr key={artwork.id} className="clickable" onClick={() => onNavigate("artwork", artwork.id)}>
                    <td>
                      <div className="row-icon">
                        <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(artwork.id.length) }} />
                        <div>
                          <div className="row-name">{artwork.title.slice(0, 36)}</div>
                          <div className="row-sub">{artwork.artist_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted">{artwork.category}</td>
                    <td className="num">{last ? fmtEur(last, true) : "—"}</td>
                    <td className="num">{fv ? fmtEur(fv, true) : "—"}</td>
                    <td className="num">
                      {last > 0 && fv > 0 ? (
                        <span className={`delta ${deltaClass(delta)}`}>
                          <span className="delta-tri">{deltaTri(delta)}</span>{fmtPct(delta)}
                        </span>
                      ) : <span className="text-tertiary">—</span>}
                    </td>
                    <td className="num text-amber">{artwork.bart_score?.toFixed(0) ?? "—"}</td>
                    <td className="num">
                      <button
                        className="tool-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          remove(artwork.id);
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
