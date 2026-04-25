"use client";

import { Search, Bell } from "lucide-react";
import { INDICES } from "@/lib/data";
import { fmtPct } from "@/lib/utils";

export function Topbar() {
  const items = [...INDICES, ...INDICES];
  return (
    <header className="topbar">
      <div className="searchbar">
        <Search />
        <input type="text" placeholder="Search artists, works, galleries, indices..." />
        <span className="searchbar-kbd">/</span>
      </div>

      <div className="ticker-rail">
        <div className="ticker-track">
          {items.map((idx, i) => {
            const cls = idx.change1d > 0 ? "up" : "down";
            const tri = idx.change1d > 0 ? "▲" : "▼";
            return (
              <span key={i} className="ticker-item">
                <span className="ticker-name">{idx.short}</span>
                <span className="ticker-value">{idx.value.toFixed(2)}</span>
                <span className={`delta ${cls}`}>
                  <span className="delta-tri">{tri}</span>
                  {fmtPct(idx.change1d)}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      <div className="topbar-status">
        <span><span className="status-dot" />MARKET LIVE</span>
        <span className="topbar-divider" />
        <span className="mono">UPD 14m</span>
      </div>

      <button className="notif-btn">
        <Bell size={14} strokeWidth={1.6} />
        <span className="notif-count">14</span>
      </button>
    </header>
  );
}
