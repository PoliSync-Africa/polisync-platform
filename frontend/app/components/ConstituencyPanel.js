"use client";

const stations = [
  ["BE-TEC-001", "Verified"],
  ["BE-TEC-002", "Pending"],
  ["BE-TEC-003", "Offline"],
  ["BE-TEC-004", "Verified"]
];

export default function ConstituencyPanel() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 24
      }}
    >
      <h3>Techiman South</h3>

      <table style={{ width: "100%", marginTop: 18 }}>
        <thead>
          <tr>
            <th align="left">Station</th>
            <th align="left">Status</th>
          </tr>
        </thead>

        <tbody>
          {stations.map(([station, status]) => (
            <tr key={station}>
              <td>{station}</td>
              <td>{status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
