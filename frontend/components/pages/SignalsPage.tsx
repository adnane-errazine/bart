"use client";

import { useEffect, useState } from "react";
import { api, type Signal } from "@/lib/api";

const TYPES = ["All", "mover", "fair-value", "alert", "watchlist", "confidence"];

export function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.signals().then((data) => {
      setSignals(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const visible = filter === "All" ? signals : signals.filter((s) => s.type === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Live Feed</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Signals</h1>
        </div>
        <div className="page-header-right">
          <span className="mono caption">{signals.length} signals today</span>
        </div>
      </div>

      <div className="filter-bar mb-0">
        <span className="filter-label">Filter:</span>
        {TYPES.map((t) => (
          <button key={t} className={`pill${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>
            {t === "fair-value" ? "Fair Value" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-body flush">
          {loading ? (
            <div className="caption" style={{ padding: "24px 16px" }}>Loading signals…</div>
          ) : visible.length === 0 ? (
            <div className="caption" style={{ padding: "24px 16px" }}>No signals for this filter.</div>
          ) : visible.map((s, i) => (
            <div key={i} className="signal-row">
              <div className="signal-time">{s.time}</div>
              <div className={`signal-type ${s.type}`}>
                {s.type.replace("-", " ").toUpperCase()}
              </div>
              <div className="signal-text">{s.text}</div>
              <div className={`signal-impact ${s.impactClass === "up" ? "text-up" : s.impactClass === "down" ? "text-down" : "text-tertiary"}`}>
                {s.impact}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
