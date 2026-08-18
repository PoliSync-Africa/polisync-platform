"use client";

const countries = [
  { name: "Ghana", x: 180, y: 220, status: "Active" },
  { name: "Nigeria", x: 230, y: 215, status: "Pilot" },
  { name: "Kenya", x: 360, y: 230, status: "Coming Soon" },
  { name: "South Africa", x: 330, y: 390, status: "Coming Soon" },
  { name: "Uganda", x: 350, y: 205, status: "Coming Soon" }
];

export default function AfricaMap() {
  return (
    <div
      style={{
        background: "#082C24",
        borderRadius: 24,
        padding: 24,
        color: "white"
      }}
    >
      <h2 style={{ color: "#D4AF37" }}>Africa Operations Map</h2>

      <svg
        viewBox="0 0 500 450"
        style={{ width: "100%", height: 400 }}
      >
        <path
          d="M140 70 L220 40 L330 70 L390 170 L360 320 L250 410 L170 360 L120 220 Z"
          fill="#145A46"
          stroke="#D4AF37"
          strokeWidth="3"
        />

        {countries.map((country) => (
          <g key={country.name}>
            <circle
              cx={country.x}
              cy={country.y}
              r="8"
              fill={
                country.status === "Active"
                  ? "#22C55E"
                  : country.status === "Pilot"
                  ? "#F59E0B"
                  : "#64748B"
              }
            />

            <text
              x={country.x + 12}
              y={country.y + 5}
              fill="white"
              fontSize="12"
            >
              {country.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
