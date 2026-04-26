"use client";

import { useState, useEffect, useCallback } from "react";
import { fmtEur, fmtPct, deltaClass, synthPainting } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { api, type Artwork, type Sale, type Enrichment } from "@/lib/api";

interface Props { artworkId?: string; onNavigate: (r: string, p?: string) => void; }

const CATEGORIES = ["All", "Street Art", "Blue Chip", "Modern Masters", "Ultra-Contemporary", "Photography"];
const PAGE_SIZE = 20;

// ─── Score badge ──────────────────────────────────────────────────────────────

function BartBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="mono text-tertiary">—</span>;
  const color = score >= 85 ? "var(--color-up)" : score >= 70 ? "var(--accent-amber)" : "var(--text-secondary)";
  return (
    <span className="mono" style={{ color, fontWeight: 500 }}>{score.toFixed(0)}</span>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ArtworkList({ onNavigate }: { onNavigate: (r: string, p?: string) => void }) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback((cat: string, q: string, pg: number) => {
    setLoading(true);
    const params: Parameters<typeof api.artworks>[0] = { limit: PAGE_SIZE, offset: pg * PAGE_SIZE };
    if (cat !== "All") params.category = cat;
    if (q.trim()) params.artist_name = q.trim();
    api.artworks(params).then((data) => {
      setArtworks(data);
      setLoading(false);
    });
  }, []);

  // Load total count for pagination (once per category/search)
  useEffect(() => {
    const params: Parameters<typeof api.artworks>[0] = { limit: 1000 };
    if (category !== "All") params.category = category;
    api.artworks(params).then((all) => setTotal(all.length));
  }, [category]);

  useEffect(() => {
    setPage(0);
    fetchPage(category, search, 0);
  }, [category, search, fetchPage]);

  useEffect(() => {
    fetchPage(category, search, page);
  }, [page, category, search, fetchPage]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Collection</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Artworks</h1>
          <div className="caption mt-4">{total} works · sorted by BART score</div>
        </div>
      </div>

      <div className="filter-bar" style={{ alignItems: "center", marginBottom: 12 }}>
        {CATEGORIES.map((c) => (
          <button key={c} className={`pill${category === c ? " active" : ""}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search artist…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginLeft: "auto", width: 180, padding: "4px 8px", background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12 }}
        />
      </div>

      <div className="panel">
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Segment</th>
                <th>Year</th>
                <th>Medium</th>
                <th className="num">BART</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="caption" style={{ padding: "20px 16px" }}>Loading…</td></tr>
              ) : artworks.length === 0 ? (
                <tr><td colSpan={7} className="caption" style={{ padding: "20px 16px" }}>No results.</td></tr>
              ) : artworks.map((a, i) => (
                <tr
                  key={a.id}
                  className="clickable"
                  onClick={() => onNavigate("artwork", a.id)}
                >
                  <td className="mono text-tertiary" style={{ fontSize: 11 }}>{page * PAGE_SIZE + i + 1}</td>
                  <td>
                    <div className="row-icon">
                      <div className="row-thumb" dangerouslySetInnerHTML={{ __html: synthPainting(a.id.length * 3) }} />
                      <div className="row-name" style={{ maxWidth: 240 }}>
                        {a.title.length > 36 ? a.title.slice(0, 36) + "…" : a.title}
                      </div>
                    </div>
                  </td>
                  <td className="row-sub" style={{ whiteSpace: "nowrap" }}>{a.artist_name}</td>
                  <td className="muted" style={{ fontSize: 11 }}>
                    {a.category.replace("Ultra-Contemporary", "Ultra-C").replace("Modern Masters", "Modern")}
                  </td>
                  <td className="mono muted" style={{ fontSize: 11 }}>{a.year_created ?? "—"}</td>
                  <td className="muted" style={{ fontSize: 11, maxWidth: 160 }}>
                    {a.medium ? (a.medium.length > 22 ? a.medium.slice(0, 22) + "…" : a.medium) : "—"}
                  </td>
                  <td className="num"><BartBadge score={a.bart_score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid var(--border-subtle)" }}>
            <span className="caption mono">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className="tool-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i : page < 4 ? i : page > totalPages - 5 ? totalPages - 7 + i : page - 3 + i;
                return (
                  <button
                    key={pg}
                    className={`tool-btn${pg === page ? " active" : ""}`}
                    onClick={() => setPage(pg)}
                    style={{ padding: "4px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}
                  >
                    {pg + 1}
                  </button>
                );
              })}
              <button
                className="tool-btn"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: "4px 8px", display: "flex", alignItems: "center" }}
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────

function ArtworkDetail({ artworkId, onNavigate }: { artworkId: string; onNavigate: (r: string, p?: string) => void }) {
  const [tab, setTab] = useState("story");
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTab("story");
    Promise.all([
      api.artwork(artworkId),
      api.sales(artworkId),
      api.enrichment(artworkId).catch(() => null),
    ]).then(([a, s, e]) => {
      if (cancelled) return;
      setArtwork(a);
      setSales(s);
      setEnrichment(e);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [artworkId]);

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
      <button
        className="tool-btn mb-16"
        style={{ display: "flex", alignItems: "center", gap: 4 }}
        onClick={() => onNavigate("artwork")}
      >
        <ArrowLeft size={12} strokeWidth={1.6} />
        All Artworks
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
          { id: "sales", label: `Sales (${sales.length})` },
          { id: "score", label: "Score Breakdown" },
          { id: "drivers", label: "Value Drivers" },
        ].map((t) => (
          <div key={t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </div>
        ))}
      </div>

      {tab === "story" && (
        story && story.length > 0 ? (
          <div className="story-panel mb-24">
            <div className="story-text">{story.map((p, i) => <p key={i}>{p}</p>)}</div>
            <div className="story-side">
              <h4>Sources</h4>
              <ul>{(storySources ?? []).map((s) => <li key={s}>{s}</li>)}</ul>
              {press && press.length > 0 && (
                <><h4 style={{ marginTop: 16 }}>Press</h4>
                  <ul>{press.map((p, i) => <li key={i}>{p.year} · {p.outlet} — {p.headline}</li>)}</ul></>
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
              <h4>Style</h4><p>{artwork.artwork_style ?? "—"}</p>
              {artwork.notable_owners && (<><h4 style={{ marginTop: 16 }}>Notable owners</h4><p>{artwork.notable_owners}</p></>)}
            </div>
          </div>
        )
      )}

      {tab === "sales" && (
        salesHistory.length > 0 ? (
          <div className="panel mb-24">
            <div className="panel-body flush">
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Date</th><th>Venue</th><th className="num">Price</th><th className="num">vs Estimate</th><th>Context</th>
                  </tr>
                </thead>
                <tbody>
                  {salesHistory.slice().reverse().map((s, i) => (
                    <tr key={i}>
                      <td className="mono muted" style={{ whiteSpace: "nowrap", width: 90 }}>{s.date}</td>
                      <td className="row-name">{s.venue}</td>
                      <td className="num mono">{fmtEur(s.price, true)}</td>
                      <td className="num">
                        {s.deltaEst != null
                          ? <span className={`delta ${deltaClass(s.deltaEst)}`}>{s.deltaEst > 0 ? "+" : ""}{s.deltaEst}%</span>
                          : <span className="text-tertiary">—</span>}
                      </td>
                      <td className="muted" style={{ fontSize: 11, maxWidth: 280 }}>
                        {s.explanation ? s.explanation.slice(0, 100) + (s.explanation.length > 100 ? "…" : "") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="caption mb-24">No sale records on file.</div>
        )
      )}

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
          <div className="caption mb-24">Score breakdown available for hero artworks. BART: <span className="mono">{artwork.bart_score ?? "—"}/100</span>.</div>
        )
      )}

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
            {riskBlock && <div className="risk-block"><div className="risk-title">⚠ Liquidity & Risk Note</div><div className="risk-text">{riskBlock}</div></div>}
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
            AI-enriched drivers available for hero artworks (BNK001, PCB002, JDF001). See{" "}
            <a onClick={() => setTab("sales")} style={{ color: "var(--accent-amber)", cursor: "pointer" }}>Sales History</a>.
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

// ─── Router ───────────────────────────────────────────────────────────────────

export function ArtworkPage({ artworkId, onNavigate }: Props) {
  if (!artworkId) return <ArtworkList onNavigate={onNavigate} />;
  return <ArtworkDetail artworkId={artworkId} onNavigate={onNavigate} />;
}
