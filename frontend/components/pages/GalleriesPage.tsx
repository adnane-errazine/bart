"use client";

import { GALLERIES } from "@/lib/data";
import { fmtPct, deltaClass, deltaTri } from "@/lib/utils";

function DeltaSpan({ pct }: { pct: number }) {
  return (
    <span className={`delta ${deltaClass(pct)}`}>
      <span className="delta-tri">{deltaTri(pct)}</span>
      {fmtPct(pct)}
    </span>
  );
}

export function GalleriesPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Discovery <span className="sep">/</span> Galleries <span className="sep">/</span> {GALLERIES.length} tracked</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Galleries</h1>
          <div className="caption mt-4">Bart Score Dealer — unique on the market. No competitor scores galleries.</div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Add gallery</button>
          <button className="tool-btn">Filter by tier</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Top-tier Galleries</div>
          <div className="panel-meta">By Bart Score Dealer</div>
        </div>
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th>Gallery</th>
                <th>Tier</th>
                <th className="num">Roster</th>
                <th className="num">Bart Score</th>
                <th className="num">Avg 5Y appreciation</th>
              </tr>
            </thead>
            <tbody>
              {GALLERIES.map((g) => (
                <tr key={g.id}>
                  <td>
                    <div className="row-icon">
                      <div className="row-thumb" />
                      <div>
                        <div className="row-name">{g.name}</div>
                        <div className="row-sub">{g.cities}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`tag ${g.tier === "Mega" ? "observed" : "estimated"}`}>
                      <span className="tag-dot" />{g.tier}
                    </span>
                  </td>
                  <td className="num">{g.roster}</td>
                  <td className="num text-amber">{g.bartScore}</td>
                  <td className="num"><DeltaSpan pct={g.avg5y} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rule-block mt-16">
        <strong>Bart Score Dealer.</strong> Unique scoring system in the market — combines (i) average roster appreciation 5Y, (ii) institutional placement rate, (iii) art fair selectivity (Basel/Frieze/FIAC), (iv) cross-segment positioning, (v) gallery discoverability of emerging artists. No external competitor produces equivalent scores.
      </div>
    </div>
  );
}
