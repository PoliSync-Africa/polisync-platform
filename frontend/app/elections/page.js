"use client";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ElectionCard from "../components/ElectionCard";
import SupportBubble from "../components/SupportBubble";

export default function ElectionsPage() {
  const elections = [
    {
      title: "Ghana General Election",
      country: "Ghana",
      date: "7 Dec 2028",
      progress: 92,
      status: "Live"
    },
    {
      title: "Nigeria State Election",
      country: "Nigeria",
      date: "2027",
      progress: 54,
      status: "Live"
    },
    {
      title: "Kenya Party Primaries",
      country: "Kenya",
      date: "2027",
      progress: 0,
      status: "Upcoming"
    }
  ];

  return (
    <div style={{ display: "flex", background: "#F3F5F7" }}>
      <Sidebar />

      <div style={{ flex: 1 }}>
        <Topbar />

        <div style={{ padding: 30 }}>
          <h1 style={{ color: "#0B3D2E" }}>
            Election Operations Center
          </h1>

          <p>Manage elections across Africa.</p>

          <div
            style={{
              display: "grid",
              gap: 22,
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              marginTop: 30
            }}
          >
            {elections.map((election) => (
              <ElectionCard key={election.title} {...election} />
            ))}
          </div>
        </div>

        <SupportBubble />
      </div>
    </div>
  );
}
