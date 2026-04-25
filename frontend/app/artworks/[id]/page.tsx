"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import { ChatPanel } from "@/components/ChatPanel";

function fmt(n: number) {
  return new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export default function ArtworkPage() {
  const { id } = useParams<{ id: string }>();

  const { data: artwork, isLoading: aw } = useQuery({
    queryKey: ["artwork", id],
    queryFn: () => api.artwork(id),
  });

  const { data: sales, isLoading: sl } = useQuery({
    queryKey: ["sales", id],
    queryFn: () => api.sales(id),
  });

  const lastSale = sales?.at(-1);
  const firstSale = sales?.[0];
  const appreciation =
    lastSale && firstSale && firstSale.sale_price_eur
      ? ((lastSale.sale_price_eur - firstSale.sale_price_eur) / firstSale.sale_price_eur) * 100
      : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {/* Back link */}
          <Link
            href="/"
            className="text-xs font-mono mb-4 inline-flex items-center gap-1 transition-colors hover:text-[#f97316]"
            style={{ color: "var(--muted)" }}
          >
            ← WATCHLIST
          </Link>

          {aw ? (
            <div className="h-32 border animate-pulse mt-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
          ) : artwork ? (
            <>
              {/* Header */}
              <div className="mt-4 mb-6 border-b pb-5" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className="text-[10px] font-mono font-bold tracking-widest"
                      style={{ color: "var(--accent)" }}
                    >
                      {artwork.category.toUpperCase()}
                    </span>
                    <h1 className="font-bold text-2xl mt-1 leading-tight">{artwork.title}</h1>
                    <p className="font-mono text-sm mt-1" style={{ color: "var(--muted)" }}>
                      {artwork.artist_name}
                      {artwork.year_created ? ` · ${artwork.year_created}` : ""}
                    </p>
                  </div>
                  {artwork.bart_score != null && (
                    <div
                      className="px-4 py-3 border shrink-0 text-right"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                        BART SCORE
                      </p>
                      <p
                        className="font-mono font-bold text-3xl"
                        style={{ color: artwork.bart_score >= 90 ? "var(--green)" : artwork.bart_score >= 70 ? "var(--accent)" : "var(--red)" }}
                      >
                        {artwork.bart_score.toFixed(0)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {[
                  { label: "MEDIUM", value: artwork.medium },
                  { label: "DIMENSIONS", value: artwork.dimensions_cm ? `${artwork.dimensions_cm} cm` : null },
                  { label: "NOTABLE OWNERS", value: artwork.notable_owners },
                ].map(
                  (f) =>
                    f.value && (
                      <div
                        key={f.label}
                        className="px-4 py-3 border"
                        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                      >
                        <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                          {f.label}
                        </p>
                        <p className="text-sm leading-snug">{f.value}</p>
                      </div>
                    )
                )}
              </div>

              {/* Description */}
              {artwork.description && (
                <div
                  className="px-4 py-4 border mb-6"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: "var(--accent)" }}>
                    DESCRIPTION
                  </p>
                  <p className="text-sm leading-relaxed">{artwork.description}</p>
                </div>
              )}

              {artwork.creation_context && (
                <div
                  className="px-4 py-4 border mb-6"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[10px] font-mono tracking-widest mb-2" style={{ color: "var(--accent)" }}>
                    CREATION CONTEXT
                  </p>
                  <p className="text-sm leading-relaxed">{artwork.creation_context}</p>
                </div>
              )}
            </>
          ) : (
            <p className="mt-8 text-sm font-mono" style={{ color: "var(--muted)" }}>Artwork not found.</p>
          )}

          {/* Sales history */}
          <div className="mb-6">
            <h2 className="font-mono font-bold tracking-widest text-xs mb-3" style={{ color: "var(--accent)" }}>
              SALES HISTORY
            </h2>

            {/* Appreciation stat */}
            {appreciation != null && lastSale && (
              <div className="flex gap-3 mb-3">
                <div
                  className="px-4 py-3 border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                    LAST PRICE
                  </p>
                  <p className="font-mono font-bold text-lg">{fmt(lastSale.sale_price_eur)}</p>
                </div>
                <div
                  className="px-4 py-3 border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                    APPRECIATION
                  </p>
                  <p
                    className="font-mono font-bold text-lg"
                    style={{ color: appreciation >= 0 ? "var(--green)" : "var(--red)" }}
                  >
                    {appreciation >= 0 ? "+" : ""}
                    {appreciation.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Sales table */}
            {sl ? (
              <div className="h-24 border animate-pulse" style={{ background: "var(--surface)", borderColor: "var(--border)" }} />
            ) : sales && sales.length > 0 ? (
              <div className="border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
                      {["DATE", "HOUSE", "PRICE", "EST. LOW", "EST. HIGH", "LOCATION", "BUYER"].map((h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left tracking-wider text-[10px]"
                          style={{ color: "var(--muted)" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((s, i) => (
                      <tr
                        key={s.id}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: i % 2 === 0 ? "transparent" : "var(--surface)",
                        }}
                      >
                        <td className="px-3 py-2">{s.sale_date}</td>
                        <td className="px-3 py-2" style={{ color: "var(--muted)" }}>{s.auction_house ?? "—"}</td>
                        <td className="px-3 py-2 font-bold">{fmt(s.sale_price_eur)}</td>
                        <td className="px-3 py-2" style={{ color: "var(--muted)" }}>{s.estimate_low_eur ? fmt(s.estimate_low_eur) : "—"}</td>
                        <td className="px-3 py-2" style={{ color: "var(--muted)" }}>{s.estimate_high_eur ? fmt(s.estimate_high_eur) : "—"}</td>
                        <td className="px-3 py-2" style={{ color: "var(--muted)" }}>{s.sale_location ?? "—"}</td>
                        <td className="px-3 py-2" style={{ color: "var(--muted)" }}>{s.buyer_name ?? s.buyer_type ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs font-mono py-4" style={{ color: "var(--muted)" }}>
                No sales records found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chat */}
      <ChatPanel artworkId={id} />

      {/* Disclaimer */}
      <div
        className="px-4 py-1 border-t text-center"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}
      >
        <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
          For informational purposes only. Not investment advice.
        </span>
      </div>
    </div>
  );
}
