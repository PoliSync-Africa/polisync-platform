"use client";

const feed = [
  "Techiman South submitted results.",
  "Kintampo North reached 94% reporting.",
  "Bono East verification completed.",
  "Polling Station BE-TEC-014 uploaded EC8."
];

export default function LiveFeed() {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 20,
        padding: 24
      }}
    >
      <h3>Live Election Feed</h3>

      <div style={{ marginTop: 20 }}>
        {feed.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "14px 0",
              borderBottom: "1px solid #F1F5F9"
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
