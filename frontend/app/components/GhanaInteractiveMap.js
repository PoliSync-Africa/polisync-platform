"use client";

const regions = [
  { name: "Greater Accra", x: 290, y: 340 },
  { name: "Ashanti", x: 210, y: 230 },
  { name: "Bono East", x: 180, y: 170 },
  { name: "Eastern", x: 260, y: 260 },
  { name: "Central", x: 180, y: 310 },
  { name: "Northern", x: 220, y: 90 },
  { name: "Upper East", x: 260, y: 40 },
  { name: "Upper West", x: 120, y: 50 },
  { name: "Savannah", x: 140, y: 120 },
  { name: "North East", x: 250, y: 70 },
  { name: "Western", x: 80, y: 280 },
  { name: "Western North", x: 90, y: 200 },
  { name: "Ahafo", x: 120, y: 180 },
  { name: "Bono", x: 140, y: 160 },
  { name: "Volta", x: 320, y: 230 },
  { name: "Oti", x: 300, y: 170 }
];

export default function GhanaInteractiveMap() {
  return (
    <div
      style={{
        background: "#082C24",
        borderRadius: 24,
        padding: 24,
        color: "white"
      }}
    >
      <h2 style={{ color: "#D4AF37" }}>Ghana Live Operations</h2>

      <svg viewBox="0 0 420 420" style={{ width: "100%", height: 420 }}>
        <path
          d="M140 20 L250 40 L330 120 L350 240 L290 390 L150 360 L70 260 L90 120 Z"
          fill="#145A46"
          stroke="#D4AF37"
          strokeWidth="3"
        />

        {regions.map((region) => (
          <g key={region.name}>
            <circle
              cx={region.x}
              cy={region.y}
              r="7"
              fill="#22C55E"
            />

            <text
              x={region.x + 10}
              y={region.y + 5}
              fill="white"
              fontSize="10"
            >
              {region.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
