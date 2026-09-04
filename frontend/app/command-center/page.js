"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import SupportBubble from "../components/SupportBubble";
import AfricaMap from "../components/AfricaMap";
import GhanaMap from "../components/GhanaMap";
import LiveFeed from "../components/LiveFeed";
import AlertPanel from "../components/AlertPanel";

export default function CommandCenter() {
  return (
    <div className="command-center-shell">
      <Sidebar />

      <div className="command-center-main">
        <Topbar />

        <main className="command-center-content">
          <section className="command-center-hero">
            <h1>Election Night Command Center</h1>
            <p>Manage elections across Africa from one secure operations center.</p>
          </section>

          <section className="command-center-stats" aria-label="Election overview">
            <StatCard title="Reporting" value="92%" />
            <StatCard title="Polling Stations" value="24,731" />
            <StatCard title="Countries" value="5" />
            <StatCard title="Live Alerts" value="3" />
          </section>

          <section className="command-center-map-grid">
            <AfricaMap />
            <GhanaMap />
          </section>

          <section className="command-center-feed-grid">
            <LiveFeed />
            <AlertPanel />
          </section>
        </main>

        <SupportBubble />
      </div>
    </div>
  );
}
