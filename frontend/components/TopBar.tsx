"use client";

import { useEffect, useState } from "react";

const TICKERS = [
  { code: "BC", name: "BLUE CHIP", value: 4247.8, change: 0.8, up: true },
  { code: "MM", name: "MOD. MASTERS", value: 3891.2, change: -0.3, up: false },
  { code: "UC", name: "ULTRA-CONTEMP", value: 3124.5, change: 2.1, up: true },
  { code: "PH", name: "PHOTOGRAPHY", value: 2156.9, change: 0.4, up: true },
  { code: "SA", name: "STREET ART", value: 5089.3, change: 4.2, up: true },
];

export function TopBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-GB", { hour12: false }) +
          " · " +
          now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className="flex items-center gap-0 h-10 border-b text-xs shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 border-r h-full shrink-0" style={{ borderColor: "var(--border)" }}>
        <span className="font-mono font-bold text-base tracking-widest" style={{ color: "var(--accent)" }}>
          BART
        </span>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "var(--muted)" }}>
          ART TERMINAL
        </span>
      </div>

      {/* Tickers */}
      <div className="flex items-center flex-1 overflow-x-auto">
        {TICKERS.map((t, i) => (
          <div
            key={t.code}
            className="flex items-center gap-3 px-4 h-full border-r shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="font-mono font-bold tracking-wider" style={{ color: "var(--muted)" }}>
              {t.code}
            </span>
            <span className="font-mono font-bold">{t.value.toLocaleString("en-US", { minimumFractionDigits: 1 })}</span>
            <span className="font-mono font-bold" style={{ color: t.up ? "var(--green)" : "var(--red)" }}>
              {t.up ? "+" : ""}{t.change}%
            </span>
          </div>
        ))}
      </div>

      {/* Clock */}
      <div className="px-4 font-mono shrink-0" style={{ color: "var(--muted)" }}>
        {time}
      </div>
    </header>
  );
}
