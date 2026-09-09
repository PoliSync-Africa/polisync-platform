"use client";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const metrics = [
  ["Field volunteers", "12,480", "Platform-wide visibility"],
  ["Active field teams", "318", "Current teams"],
  ["Attendance", "92%", "Today's check-ins"],
  ["Open incidents", "18", "Requires attention"],
];

const activities = [
  ["Field activity", "Bono East", "Regional activity reported", "08:42"],
  ["Incident", "Techiman", "Missing materials reported", "08:18"],
  ["Readiness", "Kintampo South", "Polling station readiness update", "07:55"],
  ["Report", "Nkoranza", "Field report received", "07:32"],
];

export default function FieldOperationsPage() {
  return (
    <DashboardShell role="super_admin" navigation={superAdminNavigation} activeSection="field-operations" title="Field Operations Oversight" subtitle="Platform-wide visibility into field activity without deployment control">
      <main className="page">
        <section className="hero"><div><span>SUPER ADMIN OVERSIGHT</span><h1>Field Operations</h1><p>Super Admin can monitor electoral field activity, incidents, reports and readiness. Polling-agent and organizational deployment is controlled exclusively by political parties through their party Deployment Center.</p></div></section>
        <section className="notice"><strong>Deployment control removed</strong><span>Super Admin cannot create, issue, revoke or manage party deployment invitations from this area.</span></section>
        <section className="metrics">{metrics.map(([label,value,detail]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>)}</section>
        <section className="grid">
          <article className="panel"><div className="head"><div><span>LIVE OVERSIGHT</span><h2>Field Activity</h2></div><b>VIEW ONLY</b></div>{activities.map(([type,area,text,time]) => <div className="row" key={`${type}-${time}`}><div><strong>{text}</strong><small>{type} • {area}</small></div><time>{time}</time></div>)}</article>
          <article className="panel"><div className="head"><div><span>ELECTION READINESS</span><h2>Platform Visibility</h2></div></div><Progress label="Field reporting" value={94}/><Progress label="Incident response" value={88}/><Progress label="Attendance reporting" value={92}/><Progress label="Polling-station readiness" value={91}/><p className="foot">These indicators are oversight information only. Party administrators remain responsible for their own deployment decisions and assignments.</p></article>
        </section>
      </main>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Progress({label,value}){return <div className="progress"><div><span>{label}</span><b>{value}%</b></div><i><em style={{width:`${value}%`}}/></i></div>}

const styles=`.page{min-height:100%;padding:clamp(14px,2.5vw,32px);background:#f5f8f6;color:#26332b}.hero span,.head>div>span{color:#b18b18;font-size:9px;font-weight:900;letter-spacing:1.4px}.hero h1{margin:6px 0;color:#075f2b;font-size:30px}.hero p{margin:0;max-width:900px;color:#6f7c74;font-size:12px;line-height:1.55}.notice{display:flex;gap:12px;align-items:center;padding:13px 15px;margin:14px 0;border:1px solid #e3d7a7;border-radius:12px;background:#fff9e8;color:#6e5b20}.notice strong{font-size:11px}.notice span{font-size:10px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-bottom:12px}.metrics article,.panel{background:#fff;border:1px solid #dce6df;border-radius:14px}.metrics article{padding:15px}.metrics span,.metrics small{display:block;color:#738078;font-size:9px}.metrics strong{display:block;color:#075f2b;font-size:24px;margin:6px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel{padding:16px}.head{display:flex;justify-content:space-between;gap:10px;align-items:start;margin-bottom:9px}.head h2{margin:4px 0;color:#075f2b;font-size:18px}.head b{font-size:7px;border-radius:999px;padding:5px 7px;background:#edf4ef;color:#316343}.row{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-top:1px solid #edf1ee}.row strong,.row small{display:block}.row strong{font-size:11px}.row small,.row time{color:#7c8881;font-size:8px;margin-top:3px}.progress{margin:15px 0}.progress>div{display:flex;justify-content:space-between;font-size:9px;color:#637168}.progress b{color:#075f2b}.progress>i{display:block;height:7px;margin-top:6px;background:#edf2ee;border-radius:999px;overflow:hidden}.progress em{display:block;height:100%;background:#075f2b;border-radius:999px}.foot{margin:18px 0 0;padding-top:12px;border-top:1px solid #edf1ee;color:#7a8780;font-size:9px;line-height:1.5}@media(max-width:760px){.metrics{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.notice{display:block}.notice span{display:block;margin-top:4px}}@media(max-width:480px){.metrics{grid-template-columns:1fr}}
`;
