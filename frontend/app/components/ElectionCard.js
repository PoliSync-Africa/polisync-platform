"use client";

export default function ElectionCard({ title, country, date, progress, status }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  return (
    <article className="election-card">
      <div className="card-head">
        <div className="card-copy">
          <h3>{title}</h3>
          <p>{country}</p>
        </div>
        <span className={`status ${status === "Live" ? "live" : "upcoming"}`}>{status}</span>
      </div>
      <div className="date"><span>Election date</span><strong>{date}</strong></div>
      <div className="progress-track" aria-label={`${safeProgress}% reporting`}><div className="progress-value" style={{ width: `${safeProgress}%` }} /></div>
      <div className="progress-meta"><span>Reporting progress</span><strong>{safeProgress}%</strong></div>
      <style jsx>{`
        .election-card{width:100%;min-width:0;height:100%;display:flex;flex-direction:column;padding:clamp(16px,2.4vw,24px);background:#fff;border:1px solid #0a7135;border-radius:20px;box-shadow:0 8px 20px rgba(0,0,0,.06);box-sizing:border-box;overflow:hidden}
        .card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;min-width:0}
        .card-copy{min-width:0;flex:1}
        h3{margin:0;color:#0b3d2e;font-size:clamp(16px,2vw,20px);line-height:1.25;overflow-wrap:anywhere}
        .card-copy p{margin:5px 0 0;color:#6b7280;font-size:12px;overflow-wrap:anywhere}
        .status{flex:0 0 auto;padding:6px 10px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap}
        .status.live{background:#dcfce7;color:#0b3d2e}.status.upcoming{background:#fef3c7;color:#70530a}
        .date{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:20px 0 13px;min-width:0}
        .date span,.date strong{overflow-wrap:anywhere}.date span{color:#7a867f;font-size:10px}.date strong{color:#263b31;font-size:12px;text-align:right}
        .progress-track{width:100%;height:9px;background:#e5e7eb;border-radius:999px;overflow:hidden}.progress-value{height:100%;max-width:100%;background:#0b3d2e;border-radius:inherit}
        .progress-meta{display:flex;justify-content:space-between;gap:10px;margin-top:9px;color:#7a867f;font-size:10px}.progress-meta strong{color:#0b3d2e}
        @media(max-width:430px){.election-card{padding:16px;border-radius:17px}.card-head{gap:9px}.status{padding:5px 8px;font-size:10px}.date{margin-top:16px}}
      `}</style>
    </article>
  );
}
