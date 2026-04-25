"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import { ArtworkCard } from "@/components/ArtworkCard";
import { ChatPanel } from "@/components/ChatPanel";

export default function Home() {
  const { data: artworks, isLoading } = useQuery({
    queryKey: ["artworks"],
    queryFn: api.artworks,
  });

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Page header */}
          <div className="flex items-baseline gap-4 mb-6 border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <h1 className="font-mono font-bold text-lg tracking-widest" style={{ color: "var(--accent)" }}>
              WATCHLIST
            </h1>
            <span className="text-xs font-mono" style={{ color: "var(--muted)" }}>
              {artworks ? `${artworks.length} artworks indexed` : "Loading..."}
            </span>
          </div>

          {/* Artworks grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-40 border animate-pulse"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                />
              ))}
            </div>
          ) : artworks && artworks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {artworks.map((a) => (
                <ArtworkCard key={a.id} artwork={a} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 border" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
                No artworks found — run <code className="font-mono" style={{ color: "var(--accent)" }}>uv run python seed.py</code>
              </p>
            </div>
          )}

          {/* Market summary */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "AVG BART SCORE", value: artworks ? (artworks.reduce((s, a) => s + (a.bart_score ?? 0), 0) / artworks.length).toFixed(1) : "—" },
              { label: "CATEGORIES", value: artworks ? new Set(artworks.map((a) => a.category)).size.toString() : "—" },
              { label: "ARTISTS", value: artworks ? new Set(artworks.map((a) => a.artist_name)).size.toString() : "—" },
              { label: "TOTAL ARTWORKS", value: artworks ? artworks.length.toString() : "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-4 py-3 border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <p className="text-[10px] font-mono tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                  {stat.label}
                </p>
                <p className="font-mono font-bold text-xl">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chat at the bottom */}
        <ChatPanel />
      </div>

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
