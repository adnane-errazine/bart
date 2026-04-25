"use client";

import { useState } from "react";
import { INDICES } from "@/lib/data";
import { fmtPct, deltaTri, deltaClass } from "@/lib/utils";
import { Sparkline } from "@/components/Sparkline";

export function IndicesPage() {
  const [selected, setSelected] = useState(INDICES[0].id);
  const idx = INDICES.find((i) => i.id === selected) ?? INDICES[0];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Market Indices</div>
          <h1 className="h1" style={{ marginTop: 6 }}>BART Indices</h1>
        </div>
        <div className="page-header-right">
          <div className="range-tabs">
            {["1Y", "3Y", "5Y", "10Y"].map((r) => (
              <button key={r} className={`range-tab${r === "5Y" ? " active" : ""}`}>{r}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Index strip */}
      <div className="index-strip mb-24">
        {INDICES.map((i) => {
          const dir = i.change1d > 0 ? "up" : "down";
          return (
            <div key={i.id} className={`index-card${selected === i.id ? " active" : ""}`}
              style={selected === i.id ? { background: "var(--bg-tertiary)", borderBottom: "2px solid var(--accent-amber)" } : {}}
              onClick={() => setSelected(i.id)}>
              <div className="index-card-head">
                <div className="index-card-name">{i.short}</div>
                <div className="caption mono">{i.method.slice(0, 3).toUpperCase()}</div>
              </div>
              <div className="index-card-value">{i.value.toFixed(2)}</div>
              <div className="caption">{i.name.replace("BART ", "")}</div>
              <div className="index-card-meta">
                <span className={`delta ${dir}`}>
                  <span className="delta-tri">{deltaTri(i.change1d)}</span>{fmtPct(i.change1d)}
                </span>
                <Sparkline values={i.spark30d} direction={dir} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected index detail */}
      <div className="grid-3-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">{idx.name} · Performance</div>
            <div className="panel-meta">{idx.method}</div>
          </div>
          <div className="panel-body">
            <div className="grid-2 mb-16">
              {[
                { label: "1D", val: idx.change1d },
                { label: "7D", val: idx.change7d },
                { label: "30D", val: idx.change30d },
                { label: "YTD", val: idx.changeYtd },
                { label: "1Y", val: idx.change1y },
                { label: "5Y", val: idx.change5y },
              ].map((p) => (
                <div key={p.label} className="metric">
                  <div className="metric-label">{p.label} RETURN</div>
                  <div className={`metric-value sm delta ${deltaClass(p.val)}`}>
                    <span className="delta-tri">{deltaTri(p.val)}</span>{fmtPct(p.val)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-subtle)", background: "var(--bg-tertiary)" }}>
              <Sparkline values={idx.history5y} width={500} height={160} />
            </div>
          </div>
        </div>

        <div>
          <div className="panel mb-16">
            <div className="panel-head">
              <div className="panel-title">Index Profile</div>
            </div>
            <div className="panel-body">
              {[
                { label: "Scope", val: idx.scope },
                { label: "Method", val: idx.method },
                { label: "Confidence", val: `${idx.confidence}/100` },
                { label: "Volume", val: idx.volume },
                { label: "Ann. Volatility", val: `${idx.vol}%` },
              ].map((f) => (
                <div key={f.label} className="form-row" style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 12 }}>
                  <span style={{ color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>{f.label}</span>
                  <span>{f.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
