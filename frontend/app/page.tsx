"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { HomePage } from "@/components/pages/HomePage";
import { ArtworkPage } from "@/components/pages/ArtworkPage";
import { SignalsPage } from "@/components/pages/SignalsPage";
import { IndicesPage } from "@/components/pages/IndicesPage";
import { WatchlistPage } from "@/components/pages/WatchlistPage";
import { ResearchPage } from "@/components/pages/ResearchPage";
import { MarketsPage } from "@/components/pages/MarketsPage";
import { ArtistPage } from "@/components/pages/ArtistPage";
import { TradePage } from "@/components/pages/TradePage";
import { PortfolioPage } from "@/components/pages/PortfolioPage";
import { GalleriesPage } from "@/components/pages/GalleriesPage";
import { MovementsPage } from "@/components/pages/MovementsPage";
import { ReportsPage } from "@/components/pages/ReportsPage";
import { api } from "@/lib/api";

export default function App() {
  const [route, setRoute] = useState("home");
  const [artworkParam, setArtworkParam] = useState<string | undefined>(undefined);
  const [artistParam, setArtistParam] = useState<string | undefined>(undefined);
  const [navBadges, setNavBadges] = useState<Record<string, string | number>>({});

  useEffect(() => {
    let cancelled = false;

    async function refreshBadges() {
      const [signals, artists, artworks] = await Promise.allSettled([
        api.signals({ limit: 100 }),
        api.artists(),
        api.artworks({ limit: 1000 }),
      ]);

      if (cancelled) return;

      setNavBadges((current) => ({
        ...current,
        ...(signals.status === "fulfilled" ? { signals: signals.value.length } : {}),
        ...(artists.status === "fulfilled" ? { artist: artists.value.length } : {}),
        ...(artworks.status === "fulfilled" ? { artwork: artworks.value.length } : {}),
      }));
    }

    refreshBadges();
    const timer = window.setInterval(refreshBadges, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  function navigate(r: string, param?: string) {
    setRoute(r);
    if (r === "artwork") setArtworkParam(param);
    if (r === "artist") setArtistParam(param);
  }

  function renderMain() {
    switch (route) {
      case "home": return <HomePage onNavigate={navigate} />;
      case "markets": return <MarketsPage />;
      case "artwork": return <ArtworkPage artworkId={artworkParam} onNavigate={navigate} />;
      case "artist": return <ArtistPage artistId={artistParam} onNavigate={navigate} />;
      case "signals": return <SignalsPage />;
      case "indices": return <IndicesPage />;
      case "watchlist": return <WatchlistPage onNavigate={navigate} />;
      case "research": return <ResearchPage onNavigate={navigate} />;
      case "trade": return <TradePage />;
      case "portfolio": return <PortfolioPage onNavigate={navigate} />;
      case "galleries": return <GalleriesPage />;
      case "movements": return <MovementsPage />;
      case "reports": return <ReportsPage />;
      default:
        return (
          <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
            <div style={{ textAlign: "center" }}>
              <div className="eyebrow mb-8">Coming Soon</div>
              <h2 className="h2">{route.charAt(0).toUpperCase() + route.slice(1)}</h2>
              <p className="caption mt-8">This section is being built.</p>
              <button className="tool-btn mt-16" onClick={() => navigate("home")}>← Back to Home</button>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="app">
      <Sidebar active={route} onNavigate={navigate} badges={navBadges} />
      <Topbar />
      <main className="main">{renderMain()}</main>
    </div>
  );
}
