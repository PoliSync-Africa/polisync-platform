"use client";

const events = [
  "7:42 PM — Photo captured",
  "7:42 PM — GPS verified",
  "7:43 PM — OCR completed",
  "7:43 PM — Arithmetic validated",
  "7:44 PM — Result submitted",
  "7:45 PM — Verification completed"
];

export default function EvidenceTimeline() {
  return (
    <div
      style={{
        background:"white",
        borderRadius:20,
        padding:24
      }}
    >
      <h3>Evidence Timeline</h3>

      <div style={{marginTop:20}}>
        {events.map((event,index)=>(
          <div
            key={index}
            style={{
              display:"flex",
              gap:16,
              marginBottom:18
            }}
          >
            <div
              style={{
                width:14,
                height:14,
                borderRadius:"50%",
                background:"#0B3D2E",
                marginTop:6
              }}
            />

            <div>{event}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
