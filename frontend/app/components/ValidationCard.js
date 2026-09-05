"use client";

const checks = [
  { label:"Polling station verified", ok:true },
  { label:"GPS matches location", ok:true },
  { label:"Vote totals consistent", ok:true },
  { label:"Duplicate submission", ok:false }
];

export default function ValidationCard() {
  return (
    <div
      style={{
        background:"white",
        borderRadius:20,
        padding:24
      }}
    >
      <h3>Submission Validation</h3>

      <div style={{marginTop:18}}>
        {checks.map((check)=>(
          <div
            key={check.label}
            style={{
              display:"flex",
              justifyContent:"space-between",
              padding:"12px 0",
              borderBottom:"1px solid #F1F5F9"
            }}
          >
            <span>{check.label}</span>

            <span>{check.ok ? "✅":"⚠️"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
