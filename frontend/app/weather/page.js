"use client";

import DashboardShell from "../../components/dashboard/DashboardShell";
import WeatherIntelligence from "../../components/dashboard/WeatherIntelligence";

export default function WeatherPage() {
  return (
    <DashboardShell title="Weather Intelligence" subtitle="Location-aware weather patterns and forecasts" role="user" activeSection="weather">
      <main style={{ padding: "20px", background: "#f4f7f5", minHeight: "100vh" }}>
        <WeatherIntelligence />
      </main>
    </DashboardShell>
  );
}
