"use client";

export default function NetworkStatus() {
  const providers = [
    ["MTN", "Good"],
    ["Telecel", "Moderate"],
    ["AirtelTigo", "Good"]
  ];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 24
      }}
    >
      <h3>Network Status</h3>

      {providers.map(([name, status]) => (
        <div
          key={name}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0"
          }}
        >
          <span>{name}</span>

          <span>{status}</span>
        </div>
      ))}
    </div>
  );
}
