"use client";

import { useState, useEffect } from "react";
import { fmtEur, fmtPct, deltaClass, synthPainting } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ArrowLeft } from "lucide-react";
import { api, type Artwork, type Sale, type Enrichment } from "@/lib/api";

interface Props { artworkId?: string; onNavigate: (r: string, p?: string) => void; }

const DEFAULT_ID = "BNK001";

export function ArtworkPage({ artworkId, onNavigate }: Props) {
  const id = artworkId ?? DEFAULT_ID;
  const [tab, setTab] = useState("story");
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      api.artwork(id),
      api.sales(id),
      api.enrichment(id).catch(() => null),
    ]).then(([a, s, e]) => {
      if (cancelled) return;
      setArtwork(a);
      setSales(s);
      setEnrichment(e);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading || !artwork) {
    return <div className="page"><div className="caption">Loading artwork…</div></div>;
  }

  const lastSale = artwork.last_sale ?? null;
  const fairMid = artwork.fair_value_mid_eur ?? lastSale?.price_eur ?? 0;
  const sb = enrichment?.score_breakdown;
  const drivers = enrichment?.drivers;
  const story = enrichment?.story;
  const storySources = enrichment?.story_sources;
  const provenance = enrichment?.provenance;
  const riskBlock = enrichment?.risk_block;
  const press = enrichment?.press_highlights;

  // Build a sales timeline shape from API sales
  const salesHistory = sales.map((s) => {
    const deltaEst = s.estimate_high_eur ? Math.round((s.sale_price_eur / s.estimate_high_eur - 1) * 100) : null;
    return {
      year: parseInt(s.sale_date.slice(0, 4), 10),
      date: s.sale_date,
      venue: s.auction_house ?? s.sale_location ?? "—",
      detail: [s.seller_type, s.sale_location].filter(Boolean).join(" · "),
      price: s.sale_price_eur,
      deltaEst,
      explanation: s.price_change_explanation,
    };
  });

  return (
    <div className="page">
      <button className="tool-btn mb-16 flex gap-4 items-center" style={{ display: "flex" }} onClick={() => onNavigate("home")}>
        <ArrowLeft size={12} strokeWidth={1.6} />
        Home
      </button>

      <div className="artwork-header">
        <div>
          <div className="artwork-image" dangerouslySetInnerHTML={{ __html: synthPainting(artwork.id.length) }} />
          <div style={{ position: "absolute", bottom: 8, right: 8, fontFamily: "var(--font-mono)", fontSize: 10, background: "rgba(10,10,11,0.8)", color: "var(--text-secondary)", padding: "3px 6px", border: "1px solid var(--border-subtle)" }}>
            ◉ OBSERVED
          </div>
        </div>

        <div>
          <div className="eyebrow mb-8">
            {artwork.category}
            <span className="sep">/</span>
            {artwork.year_created ?? "—"}
            <span className="sep">/</span>
            <span className="text-amber">ID {artwork.id}</span>
          </div>
          <div className="artwork-title-block">
            <button
              className="artwork-artist-name"
              style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              onClick={() => onNavigate("artist", artwork.artist_id)}
            >
              {artwork.artist_name}
            </button>
            <div className="artwork-title">{artwork.title}</div>
          </div>
          <div className="caption mt-4">{artwork.medium ?? "—"}{artwork.dimensions_cm ? ` · ${artwork.dimensions_cm} cm` : ""}</div>

          <div className="artwork-meta-grid">
            {[
              { label: "FAIR VALUE", val: fmtEur(fairMid, true) },
              { label: "CONFIDENCE", val: artwork.confidence != null ? `${artwork.confidence}/100` : "—" },
              { label: "LIQUIDITY", val: artwork.liquidity != null ? `${artwork.liquidity}/100` : "—" },
              { label: "LAST SALE", val: lastSale ? fmtEur(lastSale.price_eur, true) : "—" },
            ].map((cell) => (
              <div key={cell.label} className="artwork-meta-cell">
                <div className="metric-label">{cell.label}</div>
                <div className="metric-val">{cell.val}</div>
              </div>
            ))}
          </div>

          <div className="action-bar">
            {[
              { label: "Add to Watchlist", primary: false },
              { label: "Run Valuation", primary: false },
              { label: "Generate Report", primary: false },
              { label: "Contact Expert", primary: true },
            ].map((btn) => (
              <button key={btn.label} className={`action-btn${btn.primary ? " primary" : ""}`}>{btn.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="signature-metrics">
        <div className="sig-cell score">
          <ScoreCircle value={artwork.bart_score ?? 0} />
        </div>
        {[
          { label: "FAIR VALUE RANGE", val: fmtEur(fairMid, true), sub: artwork.fair_value_range_pct != null ? `± ${artwork.fair_value_range_pct}%` : "—" },
          { label: "RETURN SINCE 1ST SALE", val: artwork.five_y_return_pct != null ? fmtPct(artwork.five_y_return_pct) : "—", sub: `${sales.length} sale${sales.length > 1 ? "s" : ""} on record` },
          { label: "LATEST VENUE", val: lastSale?.auction_house ?? "—", sub: lastSale?.date ?? "" },
        ].map((s) => (
          <div key={s.label} className="sig-cell">
            <div className="metric-label">{s.label}</div>
            <div className="metric-value" style={{ fontSize: 22 }}>{s.val}</div>
            <div className="metric-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {[
          { id: "story", label: "Story" },
          { id: "sales", label: "Sales History" },
          { id: "score", label: "Score Breakdown" },
          { id: "drivers", label: "Value Drivers" },
        ].map((t) => (
          <div key={t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Story */}
      {tab === "story" && (
        story && story.length > 0 ? (
          <div className="story-panel mb-24">
            <div className="story-text">
              {story.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="story-side">
              <h4>Sources</h4>
              <ul>{(storySources ?? []).map((s) => <li key={s}>{s}</li>)}</ul>
              {press && press.length > 0 && (
                <>
                  <h4 style={{ marginTop: 16 }}>Press</h4>
                  <ul>
                    {press.map((p, i) => (
                      <li key={i}>{p.year} · {p.outlet} — {p.headline}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="story-panel mb-24">
            <div className="story-text">
              <p>{artwork.description ?? "—"}</p>
              {artwork.creation_context && <p>{artwork.creation_context}</p>}
            </div>
            <div className="story-side">
              <h4>Style</h4>
              <p>{artwork.artwork_style ?? "—"}</p>
              {artwork.notable_owners && (
                <>
                  <h4 style={{ marginTop: 16 }}>Notable owners</h4>
                  <p>{artwork.notable_owners}</p>
                </>
              )}
              <p style={{ marginTop: 16, color: "var(--text-tertiary)", fontSize: 10 }}>
                Enrichment narrative not available for this work. Showing CSV metadata.
              </p>
            </div>
          </div>
        )
      )}

      {/* Sales */}
      {tab === "sales" && (
        salesHistory.length > 0 ? (
          <div className="sales-block mb-24">
            <div className="sales-timeline">
              {salesHistory.slice().reverse().map((s, i) => (
                <div key={i} className="sales-timeline-item">
                  <div className="sales-timeline-year">{s.year}</div>
                  <div className="sales-timeline-body">
                    <div className="sales-timeline-venue">{s.venue}</div>
                    <div className="sales-timeline-detail">{s.detail}</div>
                    <div className="sales-timeline-price">
                      {fmtEur(s.price)}
                      {s.deltaEst != null && (
                        <span className={`delta ${deltaClass(s.deltaEst)}`} style={{ marginLeft: 8 }}>
                          {s.deltaEst > 0 ? "+" : ""}{s.deltaEst}% est.
                        </span>
                      )}
                    </div>
                    {s.explanation && (
                      <div className="sales-timeline-detail" style={{ marginTop: 4, fontStyle: "italic" }}>
                        {s.explanation.slice(0, 180)}{s.explanation.length > 180 ? "…" : ""}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="sales-chart-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p className="caption" style={{ color: "var(--text-tertiary)", textAlign: "center" }}>
                {salesHistory.length} ventes consignées sur {salesHistory.length > 1 ? `${salesHistory[salesHistory.length - 1].year - salesHistory[0].year} ans` : "1 vente"}
              </p>
            </div>
          </div>
        ) : (
          <div className="caption mb-24">No sale records on file for this artwork.</div>
        )
      )}

      {/* Score */}
      {tab === "score" && (
        sb ? (
          <div className="breakdown-grid mb-24">
            {[
              { key: "bart", title: "BART Score", score: sb.bart.provenance + sb.bart.authentication + sb.bart.momentum + sb.bart.validation + sb.bart.quality, max: 100, rows: [
                { label: "Provenance Signal", val: sb.bart.provenance, maxVal: 25 },
                { label: "Authentication", val: sb.bart.authentication, maxVal: 20 },
                { label: "Price Momentum", val: sb.bart.momentum, maxVal: 20 },
                { label: "Institutional Validation", val: sb.bart.validation, maxVal: 20 },
                { label: "Work Quality", val: sb.bart.quality, maxVal: 15 },
              ]},
              { key: "confidence", title: "Confidence Index", score: sb.confidence.depth + sb.confidence.recency + sb.confidence.verification + sb.confidence.observability, max: 100, rows: [
                { label: "Data Depth", val: sb.confidence.depth, maxVal: 30 },
                { label: "Recency", val: sb.confidence.recency, maxVal: 25 },
                { label: "Verification", val: sb.confidence.verification, maxVal: 25 },
                { label: "Observability", val: sb.confidence.observability, maxVal: 20 },
              ]},
              { key: "liquidity", title: "Liquidity Score", score: sb.liquidity.frequency + sb.liquidity.sell_through + sb.liquidity.depth + sb.liquidity.exit, max: 100, rows: [
                { label: "Sale Frequency", val: sb.liquidity.frequency, maxVal: 25 },
                { label: "Sell-Through Rate", val: sb.liquidity.sell_through, maxVal: 25 },
                { label: "Market Depth", val: sb.liquidity.depth, maxVal: 25 },
                { label: "Exit Window", val: sb.liquidity.exit, maxVal: 25 },
              ]},
            ].map((col) => (
              <div key={col.key} className="breakdown-col">
                <div className="breakdown-head">
                  <div className="breakdown-title">{col.title}</div>
                  <div className="breakdown-score">{col.score}<span className="max">/{col.max}</span></div>
                </div>
                {col.rows.map((row) => (
                  <div key={row.label} className="breakdown-row">
                    <div className="label">{row.label}</div>
                    <div className="bar"><div className="bar-fill" style={{ width: `${(row.val / row.maxVal) * 100}%` }} /></div>
                    <div className="val">{row.val}/{row.maxVal}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="caption mb-24">
            Detailed score breakdown is available for hero artworks only. BART Score: <span className="mono">{artwork.bart_score ?? "—"}/100</span>.
          </div>
        )
      )}

      {/* Drivers */}
      {tab === "drivers" && (
        drivers && drivers.length > 0 ? (
          <div className="mb-24">
            <div className="grid-3 mb-16">
              {drivers.map((d) => (
                <div key={d.num} className="driver-card">
                  <div className="driver-num">{d.num}</div>
                  <div className="driver-title">{d.title}</div>
                  <div className="driver-text">{d.text}</div>
                  <div className="driver-impact">Impact: {d.impact}</div>
                </div>
              ))}
            </div>
            {riskBlock && (
              <div className="risk-block">
                <div className="risk-title">⚠ Liquidity & Risk Note</div>
                <div className="risk-text">{riskBlock}</div>
              </div>
            )}
            {provenance && provenance.length > 0 && (
              <div className="provenance-block mt-24">
                <div className="provenance-timeline">
                  {provenance.map((p, i) => (
                    <div key={i} className="prov-item">
                      <div className="prov-year">{p.year}</div>
                      <div className={`prov-marker ${p.type}`} />
                      <div className="prov-body">
                        <div className="prov-entity">{p.entity}</div>
                        <div className="prov-detail">{p.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="provenance-side">
                  <h4 style={{ fontSize: 10, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.1em", marginBottom: 8 }}>Provenance Mix</h4>
                  {Object.entries(provenance.reduce<Record<string, number>>((acc, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {})).map(([t, n]) => (
                    <div key={t} className="prov-counter">
                      <span><span className={`prov-counter-marker prov-marker ${t}`} />{t}</span>
                      <span className="num">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="caption mb-24">
            AI-enriched value drivers are pre-generated for hero artworks (BNK001, PCB002, JDF001). For other works, see the <a onClick={() => setTab("sales")} style={{ color: "var(--accent-amber)", cursor: "pointer" }}>Sales History</a> tab where each transaction includes a market context note.
          </div>
        )
      )}

      <div className="fiche-footer">
        <span>BART Research Engine · Data sourced from public auction records</span>
        <span className="mono text-tertiary">For informational purposes only. Not investment advice.</span>
      </div>
    </div>
  );
}
