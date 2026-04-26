"use client";

import { LayoutDashboard, TrendingUp, BarChart3, Eye, Briefcase, Image, Users, Radio, LineChart, MessageSquare, SunMoon, Settings, Building2, Layers, FileText } from "lucide-react";

type Route = string;

interface Props {
  active: Route;
  onNavigate: (r: Route) => void;
  badges?: Partial<Record<Route, string | number>>;
}

const NAV = [
  {
    label: "Analytics",
    items: [
      { id: "home", icon: LayoutDashboard, label: "Home" },
      { id: "markets", icon: TrendingUp, label: "Markets" },
      { id: "indices", icon: BarChart3, label: "Indices", badge: "5" },
      { id: "watchlist", icon: Eye, label: "Watchlist", badge: "8" },
      { id: "portfolio", icon: Briefcase, label: "Portfolio" },
    ],
  },
  {
    label: "Discovery",
    items: [
      { id: "artwork", icon: Image, label: "Artwork" },
      { id: "artist", icon: Users, label: "Artists" },
      { id: "galleries", icon: Building2, label: "Galleries" },
      { id: "movements", icon: Layers, label: "Movements" },
      { id: "signals", icon: Radio, label: "Signals" },
    ],
  },
  {
    label: "Research",
    items: [
      { id: "trade", icon: LineChart, label: "Trade Simulator" },
      { id: "research", icon: MessageSquare, label: "Research" },
      { id: "reports", icon: FileText, label: "Reports" },
    ],
  },
];

export function Sidebar({ active, onNavigate, badges = {} }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-name">B<span className="accent">A</span>RT</div>
        <div className="brand-tag">Art Analytics Terminal</div>
      </div>

      <nav>
        {NAV.map((section) => (
          <div key={section.label} className="nav-section">
            <div className="nav-label">{section.label}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const badge = badges[item.id] ?? item.badge;
              return (
                <div
                  key={item.id}
                  className={`nav-item${active === item.id ? " active" : ""}`}
                  onClick={() => onNavigate(item.id)}
                >
                  <Icon />
                  {item.label}
                  {badge !== undefined && <span className="nav-item-badge">{badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">GP</div>
        <div className="user-meta">
          <div className="user-name">G. Palumbo</div>
          <div className="user-tier">Pro Tier</div>
        </div>
        <button className="icon-btn" onClick={() => {
          const html = document.documentElement;
          html.setAttribute("data-theme", html.getAttribute("data-theme") === "dark" ? "light" : "dark");
        }}>
          <SunMoon size={14} strokeWidth={1.6} />
        </button>
        <button className="icon-btn"><Settings size={14} strokeWidth={1.6} /></button>
      </div>
    </aside>
  );
}
