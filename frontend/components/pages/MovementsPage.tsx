"use client";

import { MOVEMENTS } from "@/lib/data";
import { fmtPct, deltaClass, deltaTri } from "@/lib/utils";

function DeltaSpan({ pct }: { pct: number }) {
  return (
    <span className={`delta ${deltaClass(pct)}`}>
      <span className="delta-tri">{deltaTri(pct)}</span>
      {fmtPct(pct)}
    </span>
  );
}

export function MovementsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Discovery <span className="sep">/</span> Movements</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Movements &amp; Sub-segments</h1>
          <div className="caption mt-4">Cross-cutting tags · click any movement to open the constituent artists</div>
        </div>
      </div>

      <div className="grid-3">
        {MOVEMENTS.map((m) => (
          <div key={m.name} className="panel" style={{ cursor: "pointer" }}>
            <div className="panel-body">
              <div className="caption">{m.region} · {m.count} active artists</div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>{m.name}</div>
              <div className="mt-8 mono" style={{ fontSize: 18 }}>
                <DeltaSpan pct={m.perf} />
                <span style={{ fontSize: 10, color: "var(--text-tertiary)", marginLeft: 6 }}>vs UC Index 5Y</span>
              </div>
              <div className="mt-8 caption">Key artists: {m.key.join(" · ")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
