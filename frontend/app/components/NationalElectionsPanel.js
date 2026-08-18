"use client";

import { useState } from "react";

// Structured dataset organized by Region -> Constituency -> Polling Stations
const regionalData = [
  {
    region: "Bono East",
    constituencies: [
      {
        id: "TEC-S",
        name: "Techiman South",
        stations: [
          { id: "BE-TEC-001", status: "Verified" },
          { id: "BE-TEC-002", status: "Pending" },
          { id: "BE-TEC-003", status: "Offline" },
          { id: "BE-TEC-004", status: "Verified" },
        ],
      },
      {
        id: "TEC-N",
        name: "Techiman North",
        stations: [
          { id: "BE-TEN-001", status: "Verified" },
          { id: "BE-TEN-002", status: "Verified" },
        ],
      },
      {
        id: "ATE-A",
        name: "Atebubu-Amantin",
        stations: [
          { id: "BE-ATE-001", status: "Pending" },
          { id: "BE-ATE-002", status: "Verified" },
        ],
      },
    ],
  },
  {
    region: "Greater Accra",
    constituencies: [
      {
        id: "ANY-SOW",
        name: "Anyaa-Sowutuom",
        stations: [
          { id: "GA-AYS-001", status: "Verified" },
          { id: "GA-AYS-002", status: "Verified" },
          { id: "GA-AYS-003", status: "Pending" },
        ],
      },
      {
        id: "AYW-W",
        name: "Ayawaso West Wuogon",
        stations: [
          { id: "GA-AYW-001", status: "Verified" },
          { id: "GA-AYW-002", status: "Verified" },
        ],
      },
      {
        id: "DOME-K",
        name: "Dome-Kwabenya",
        stations: [
          { id: "GA-DMK-001", status: "Offline" },
          { id: "GA-DMK-002", status: "Verified" },
        ],
      },
    ],
  },
  {
    region: "Ashanti",
    constituencies: [
      {
        id: "SUBIN",
        name: "Subin",
        stations: [
          { id: "AS-SUB-001", status: "Verified" },
          { id: "AS-SUB-002", status: "Verified" },
        ],
      },
      {
        id: "SUAME",
        name: "Suame",
        stations: [
          { id: "AS-SUA-001", status: "Pending" },
          { id: "AS-SUA-002", status: "Verified" },
        ],
      },
    ],
  },
];

const statusStyles = {
  Verified: { color: "#15803d", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" },
  Pending: { color: "#b45309", backgroundColor: "#fffbeb", border: "1px solid #fde68a" },
  Offline: { color: "#b91c1c", backgroundColor: "#fef2f2", border: "1px solid #fecaca" },
};

export default function NationalElectionsPanel() {
  const [selectedRegionIndex, setSelectedRegionIndex] = useState(0);
  const [selectedConstituencyIndex, setSelectedConstituencyIndex] = useState(0);

  const activeRegion = regionalData[selectedRegionIndex];
  const activeConstituency = activeRegion?.constituencies[selectedConstituencyIndex];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
        maxWidth: 700,
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h2 style={{ margin: "0 0 16px 0", fontSize: "1.5rem", color: "#111827" }}>
        Ghana National Polling Tracker
      </h2>

      {/* Selectors for Region and Constituency */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "0.85rem", color: "#6b7280", display: "block", marginBottom: 4 }}>
            Region
          </label>
          <select
            value={selectedRegionIndex}
            onChange={(e) => {
              setSelectedRegionIndex(Number(e.target.value));
              setSelectedConstituencyIndex(0); // Reset constituency selection on region change
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
            }}
          >
            {regionalData.map((reg, idx) => (
              <option key={reg.region} value={idx}>
                {reg.region} Region
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ fontSize: "0.85rem", color: "#6b7280", display: "block", marginBottom: 4 }}>
            Constituency
          </label>
          <select
            value={selectedConstituencyIndex}
            onChange={(e) => setSelectedConstituencyIndex(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              backgroundColor: "#f9fafb",
            }}
          >
            {activeRegion.constituencies.map((con, idx) => (
              <option key={con.id} value={idx}>
                {con.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Results Display */}
      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 16 }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1.15rem", color: "#1f2937" }}>
          {activeConstituency.name} ({activeRegion.region} Region)
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <th align="left" style={{ paddingBottom: 10, color: "#6b7280", fontSize: "0.9rem" }}>
                Polling Station
              </th>
              <th align="left" style={{ paddingBottom: 10, color: "#6b7280", fontSize: "0.9rem" }}>
                Verification Status
              </th>
            </tr>
          </thead>
          <tbody>
            {activeConstituency.stations.map((station) => (
              <tr key={station.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "12px 0", fontWeight: 500, fontSize: "0.95rem" }}>
                  {station.id}
                </td>
                <td style={{ padding: "12px 0" }}>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      ...statusStyles[station.status],
                    }}
                  >
                    {station.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
