import Link from "next/link";
import type { Artwork } from "@/lib/api";

const CATEGORY_COLORS: Record<string, string> = {
  "Blue Chip": "#60a5fa",
  "Modern Masters": "#a78bfa",
  "Ultra-Contemporary": "#f97316",
  Photography: "#34d399",
  "Street Art": "#f472b6",
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(score, 100);
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#f97316" : "#ef4444";
  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
          BART SCORE
        </span>
        <span className="font-mono font-bold text-sm" style={{ color }}>
          {score.toFixed(0)}
        </span>
      </div>
      <div className="h-[2px] w-full" style={{ background: "var(--border)" }}>
        <div className="h-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export function ArtworkCard({ artwork }: { artwork: Artwork }) {
  const catColor = CATEGORY_COLORS[artwork.category] ?? "var(--muted)";

  return (
    <Link href={`/artworks/${artwork.id}`} className="block group">
      <div
        className="p-4 border transition-colors group-hover:border-[#f97316]/50"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Category pill */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 border"
            style={{ color: catColor, borderColor: catColor + "44", background: catColor + "11" }}
          >
            {artwork.category.toUpperCase()}
          </span>
          {artwork.year_created && (
            <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
              {artwork.year_created}
            </span>
          )}
        </div>

        {/* Title & artist */}
        <p className="font-bold text-sm leading-snug mb-0.5 group-hover:text-[#f97316] transition-colors">
          {artwork.title}
        </p>
        <p className="text-xs font-mono" style={{ color: "var(--muted)" }}>
          {artwork.artist_name}
        </p>

        {/* Medium */}
        {artwork.medium && (
          <p className="text-[11px] mt-2 leading-snug" style={{ color: "var(--muted)" }}>
            {artwork.medium}
          </p>
        )}

        {/* Score */}
        {artwork.bart_score != null && <ScoreBar score={artwork.bart_score} />}
      </div>
    </Link>
  );
}
