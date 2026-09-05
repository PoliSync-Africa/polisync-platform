"use client";

export default function MemberCard({
  name,
  constituency,
  status
}) {
  return (
    <div
      style={{
        background:"white",
        borderRadius:18,
        padding:20
      }}
    >
      <h3>{name}</h3>

      <p>{constituency}</p>

      <span
        style={{
          background:"#DCFCE7",
          color:"#166534",
          padding:"6px 12px",
          borderRadius:20
        }}
      >
        {status}
      </span>
    </div>
  );
}
