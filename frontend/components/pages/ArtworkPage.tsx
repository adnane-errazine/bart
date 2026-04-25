"use client";

import { useState } from "react";
import { ARTWORKS } from "@/lib/data";
import { fmtEur, fmtPct, deltaTri, deltaClass, synthPainting } from "@/lib/utils";
import { ScoreCircle } from "@/components/ScoreCircle";
import { BookOpen, TrendingUp, Shield, AlertTriangle, ArrowLeft } from "lucide-react";

interface Props { artworkId?: string; onNavigate: (r: string) => void; }

export function ArtworkPage({ artworkId, onNavigate }: Props) {
  const [tab, setTab] = useState("story");
  const a = ARTWORKS.find((x) => x.id === artworkId) ?? ARTWORKS[0];

  const sb = (a as any).scoreBreakdown;
  const drivers = (a as any).drivers;
  const story = (a as any).story as string[] | undefined;
  const storySources = (a as any).storySources as string[] | undefined;
  const salesHistory = (a as any).salesHistory;
  const riskBlock = (a as any).riskBlock;

  return (
    <div className="page">
      {/* Back */}
      <button className="tool-btn mb-16 flex gap-4 items-center" style={{ display: "flex" }} onClick={() => onNavigate("home")}>
        <ArrowLeft size={12} strokeWidth={1.6} />
        Watchlist
      </button>

      {/* Artwork Header */}
      <div className="artwork-header">
        <div>
          <div className="artwork-image" dangerouslySetInnerHTML={{ __html: synthPainting(a.id.length) }} />
          <div style={{ position: "absolute", bottom: 8, right: 8, fontFamily: "var(--font-mono)", fontSize: 10, background: "rgba(10,10,11,0.8)", color: "var(--text-secondary)", padding: "3px 6px", border: "1px solid var(--border-subtle)" }}>
            ◉ OBSERVED
          </div>
        </div>

        <div>
          <div className="eyebrow mb-8">
            {a.segment}
            <span className="sep">/</span>
            {a.year}
            <span className="sep">/</span>
            <span className="text-amber">ID {a.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="artwork-title-block">
            <div className="artwork-artist-name">{a.artist}</div>
            <div className="artwork-title">{a.title}</div>
          </div>
          <div className="caption mt-4">{a.medium} · {a.dimensions}</div>

          <div className="artwork-meta-grid">
            {[
              { label: "FAIR VALUE", val: fmtEur((a as any).fairValueMid, true) },
              { label: "CONFIDENCE", val: `${a.confidence}/100` },
              { label: "LIQUIDITY", val: `${a.liquidity}/100` },
              { label: "LAST SALE", val: a.lastSale ? fmtEur(a.lastSale.price, true) : "—" },
            ].map((cell) => (
              <div key={cell.label} className="artwork-meta-cell">
                <div className="metric-label">{cell.label}</div>
                <div className="metric-val">{cell.val}</div>
              </div>
            ))}
          </div>

          {/* Action bar */}
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

      {/* Signature Metrics */}
      <div className="signature-metrics">
        <div className="sig-cell score">
          <ScoreCircle value={a.bartScore} />
        </div>
        {[
          { label: "FAIR VALUE RANGE", val: fmtEur((a as any).fairValueMid, true), sub: `± ${(a as any).fairValueRange ?? "—"}%` },
          { label: "5Y RETURN", val: fmtPct((a as any).fiveYReturn ?? 0), sub: `+${(a as any).vsIndexBp ?? "—"}bp vs index` },
          { label: "TIME TO EXIT", val: (a as any).timeToExit ?? "—", sub: `Spread ${(a as any).spread ?? "—"}` },
        ].map((s) => (
          <div key={s.label} className="sig-cell">
            <div className="metric-label">{s.label}</div>
            <div className="metric-value" style={{ fontSize: 22 }}>{s.val}</div>
            <div className="metric-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
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

      {/* Tab: Story */}
      {tab === "story" && story && (
        <div className="story-panel mb-24">
          <div className="story-text">
            {story.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          {storySources && (
            <div className="story-side">
              <h4>Sources</h4>
              <ul>{storySources.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {/* Tab: Sales */}
      {tab === "sales" && salesHistory && (
        <div className="sales-block mb-24">
          <div className="sales-timeline">
            {salesHistory.map((s: any, i: number) => (
              <div key={i} className="sales-timeline-item">
                <div className="sales-timeline-year">{s.year}</div>
                <div className="sales-timeline-body">
                  <div className="sales-timeline-venue">{s.venue}</div>
                  <div className="sales-timeline-detail">{s.detail}</div>
                  <div className="sales-timeline-price">
                    {fmtEur(s.price)}
                    {s.deltaEst != null && (
                      <span className={`delta ${deltaClass(s.deltaEst)} ml-8`} style={{ marginLeft: 8 }}>
                        {s.deltaEst > 0 ? "+" : ""}{s.deltaEst}% est.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="sales-chart-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="caption" style={{ color: "var(--text-tertiary)", textAlign: "center" }}>
              Price chart will connect to live data in v2
            </p>
          </div>
        </div>
      )}

      {/* Tab: Score */}
      {tab === "score" && sb && (
        <div className="breakdown-grid mb-24">
          {[
            { key: "bart", title: "BART Score", score: sb.bart.total, max: 100, rows: [
              { label: "Provenance Signal", val: sb.bart.provenance, maxVal: sb.bart.max.provenance },
              { label: "Authentication", val: sb.bart.authentication, maxVal: sb.bart.max.authentication },
              { label: "Price Momentum", val: sb.bart.momentum, maxVal: sb.bart.max.momentum },
              { label: "Institutional Validation", val: sb.bart.validation, maxVal: sb.bart.max.validation },
              { label: "Work Quality", val: sb.bart.quality, maxVal: sb.bart.max.quality },
            ]},
            { key: "confidence", title: "Confidence Index", score: sb.confidence.total, max: 100, rows: [
              { label: "Data Depth", val: sb.confidence.depth, maxVal: sb.confidence.max.depth },
              { label: "Recency", val: sb.confidence.recency, maxVal: sb.confidence.max.recency },
              { label: "Verification", val: sb.confidence.verification, maxVal: sb.confidence.max.verification },
              { label: "Observability", val: sb.confidence.observability, maxVal: sb.confidence.max.observability },
            ]},
            { key: "liquidity", title: "Liquidity Score", score: sb.liquidity.total, max: 100, rows: [
              { label: "Sale Frequency", val: sb.liquidity.frequency, maxVal: sb.liquidity.max.frequency },
              { label: "Sell-Through Rate", val: sb.liquidity.sellThrough, maxVal: sb.liquidity.max.sellThrough },
              { label: "Market Depth", val: sb.liquidity.depth, maxVal: sb.liquidity.max.depth },
              { label: "Exit Window", val: sb.liquidity.exit, maxVal: sb.liquidity.max.exit },
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
      )}

      {/* Tab: Drivers */}
      {tab === "drivers" && drivers && (
        <div className="mb-24">
          <div className="grid-3 mb-16">
            {drivers.map((d: any) => (
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
        </div>
      )}

      <div className="fiche-footer">
        <span>BART Research Engine · Data sourced from public auction records</span>
        <span className="mono text-tertiary">For informational purposes only. Not investment advice.</span>
      </div>
    </div>
  );
}
