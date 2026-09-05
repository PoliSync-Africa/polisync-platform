"use client";

const alerts = [
  {
    type: "Fraud Alert",
    color: "#DC2626",
    message: "Duplicate submission detected."
  },
  {
    type: "Verification",
    color: "#F59E0B",
    message: "GPS mismatch requires review."
  },
  {
    type: "System",
    color: "#2563EB",
    message: "Server operating normally."
  }
];

export default function AlertPanel() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 24
      }}
    >
      <h3>Integrity Center</h3>

      <div style={{ marginTop: 18 }}>
        {alerts.map((alert, index) => (
          <div
            key={index}
            style={{
              borderLeft: `5px solid ${alert.color}`,
              padding: "12px 16px",
              background: "#F8FAFC",
              marginBottom: 12
            }}
          >
            <strong>{alert.type}</strong>
            <div>{alert.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
