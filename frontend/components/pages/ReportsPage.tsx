"use client";

import { REPORTS } from "@/lib/data";

export function ReportsPage() {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="eyebrow">Research <span className="sep">/</span> Reports</div>
          <h1 className="h1" style={{ marginTop: 6 }}>Reports Library</h1>
          <div className="caption mt-4">Curated outputs · quarterly, event briefs, methodology updates, deep dives</div>
        </div>
        <div className="page-header-right">
          <button className="tool-btn">Subscribe</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body flush">
          <table className="dtable">
            <thead>
              <tr>
                <th>Report</th>
                <th>Date</th>
                <th className="num">Length</th>
                <th>Status</th>
                <th className="num">Action</th>
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r, i) => (
                <tr key={i} className="clickable">
                  <td>
                    <div className="row-name">{r.title}</div>
                    <div className="row-sub">{r.type}</div>
                  </td>
                  <td className="mono muted">{r.date}</td>
                  <td className="num muted">{r.pages}p</td>
                  <td>
                    <span className={`tag ${r.status === "NEW" ? "observed" : ""}`}>
                      {r.status === "NEW" && <span className="tag-dot" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="num">
                    <button className="tool-btn">Open PDF</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
