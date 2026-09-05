"use client";

import { useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import superAdminNavigation from "../../../components/dashboard/superAdminNavigation";

const tabs = [
  ["overview", "Operations Overview"],
  ["volunteers", "Volunteers"],
  ["teams", "Field Teams"],
  ["tasks", "Tasks"],
  ["agents", "Polling Agents"],
  ["attendance", "Attendance & Check-ins"],
  ["incidents", "Incidents"],
  ["logistics", "Logistics"],
  ["routes", "Route Planning"],
];

const initialVolunteers = [
  { id: "VOL-001", name: "Ama Mensah", role: "Volunteer", area: "Techiman", status: "Active", training: "Trained" },
  { id: "VOL-002", name: "Kwame Asante", role: "Polling Agent", area: "Kintampo", status: "Active", training: "Trained" },
  { id: "VOL-003", name: "Akosua Boateng", role: "Field Officer", area: "Nkoranza", status: "Offline", training: "Pending" },
];

const initialTasks = [
  { title: "Polling station readiness check", area: "Techiman North", priority: "High", assignee: "Ama Mensah", status: "In Progress" },
  { title: "Distribute field materials", area: "Kintampo South", priority: "Medium", assignee: "Kwame Asante", status: "Pending" },
  { title: "Door-to-door coverage", area: "Nkoranza", priority: "High", assignee: "Akosua Boateng", status: "Completed" },
];

const incidents = [
  { type: "Missing Materials", area: "Techiman", severity: "High", time: "08:42", status: "Open" },
  { type: "Equipment Failure", area: "Kintampo", severity: "Medium", time: "08:18", status: "Assigned" },
  { type: "Weather Problem", area: "Nkoranza", severity: "Low", time: "07:55", status: "Monitoring" },
];

export default function FieldOperationsPage() {
  const [tab, setTab] = useState("overview");
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [tasks, setTasks] = useState(initialTasks);
  const [showVolunteerForm, setShowVolunteerForm] = useState(false);
  const [notice, setNotice] = useState("");

  const activeVolunteers = volunteers.filter((v) => v.status === "Active").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const attendance = 92;
  const openIncidents = incidents.filter((i) => i.status !== "Monitoring").length;

  const tabLabel = useMemo(() => tabs.find(([key]) => key === tab)?.[1] || "Operations Overview", [tab]);

  const addVolunteer = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const area = String(form.get("area") || "").trim();
    const role = String(form.get("role") || "Volunteer");
    if (!name || !area) return;
    setVolunteers((current) => [...current, {
      id: `VOL-${String(current.length + 1).padStart(3, "0")}`,
      name, area, role, status: "Active", training: "Pending",
    }]);
    event.currentTarget.reset();
    setShowVolunteerForm(false);
    setNotice(`${name} added to the field operations roster.`);
  };

  const completeTask = (index) => {
    setTasks((current) => current.map((task, i) => i === index ? { ...task, status: "Completed" } : task));
    setNotice("Task marked as completed.");
  };

  return (
    <DashboardShell
      title="Field Operations"
      subtitle="Volunteer management, field teams, polling agents, attendance, incidents and logistics"
      role="super_admin"
      navigation={superAdminNavigation}
      activeSection="field-operations"
    >
      <div className="fo-page">
        <div className="fo-topbar">
          <div>
            <div className="fo-kicker">FIELD OPERATIONS & VOLUNTEER MANAGEMENT</div>
            <h2>{tabLabel}</h2>
            <p>Coordinate activity from headquarters to electoral areas and polling stations.</p>
          </div>
          <div className="fo-actions">
            <button onClick={() => setNotice("Emergency broadcast workflow opened.")}>Emergency Broadcast</button>
            <button className="primary" onClick={() => setShowVolunteerForm(true)}>+ Add Volunteer</button>
          </div>
        </div>

        {notice && <div className="fo-notice" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}

        <div className="fo-tabs">
          {tabs.map(([key, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>)}
        </div>

        {tab === "overview" && <>
          <div className="fo-stats">
            <Stat label="Active Volunteers" value={activeVolunteers} detail={`${volunteers.length} total roster`} />
            <Stat label="Tasks Completed" value={`${completedTasks}/${tasks.length}`} detail="Current assignments" />
            <Stat label="Attendance" value={`${attendance}%`} detail="Today's check-ins" />
            <Stat label="Open Incidents" value={openIncidents} detail="Requires attention" alert />
          </div>
          <div className="fo-grid">
            <Panel title="Live Field Activity" action="View coverage map" onAction={() => setTab("routes")}>
              <div className="fo-map"><div className="map-pin p1">Techiman</div><div className="map-pin p2">Kintampo</div><div className="map-pin p3">Nkoranza</div><div className="map-center">LIVE FIELD COVERAGE</div></div>
            </Panel>
            <Panel title="Priority Incidents" action="View all" onAction={() => setTab("incidents")}>
              {incidents.map((item) => <div className="fo-row" key={`${item.type}-${item.time}`}><div><strong>{item.type}</strong><small>{item.area} · {item.time}</small></div><Badge value={item.severity} /></div>)}
            </Panel>
          </div>
          <div className="fo-grid">
            <Panel title="Today's Tasks" action="Manage tasks" onAction={() => setTab("tasks")}>
              {tasks.map((task, index) => <div className="fo-row" key={task.title}><div><strong>{task.title}</strong><small>{task.area} · {task.assignee}</small></div><button className="mini" disabled={task.status === "Completed"} onClick={() => completeTask(index)}>{task.status}</button></div>)}
            </Panel>
            <Panel title="Election-Day Readiness">
              <div className="fo-readiness"><Readiness label="Polling agents deployed" value={84} /><Readiness label="Materials issued" value={76} /><Readiness label="Stations checked in" value={91} /></div>
            </Panel>
          </div>
        </>}

        {tab === "volunteers" && <Roster volunteers={volunteers} />}
        {tab === "teams" && <SimpleCards title="Field Teams" items={["Region Team — Bono East", "Techiman Constituency Team", "Kintampo Electoral Area Team", "Polling Station Teams", "Special Campaign Unit"]} />}
        {tab === "tasks" && <TaskList tasks={tasks} onComplete={completeTask} />}
        {tab === "agents" && <SimpleCards title="Polling Agent Deployment" items={["Assigned polling station", "Reporting time", "Backup agent", "Contact information", "Materials issued"]} />}
        {tab === "attendance" && <Attendance />}
        {tab === "incidents" && <IncidentList />}
        {tab === "logistics" && <Logistics />}
        {tab === "routes" && <Routes />}

        {showVolunteerForm && <div className="fo-modal-backdrop" onClick={() => setShowVolunteerForm(false)}><form className="fo-modal" onSubmit={addVolunteer} onClick={(e) => e.stopPropagation()}><h3>Add Volunteer</h3><input name="name" placeholder="Full name" required /><input name="area" placeholder="Assigned area" required /><select name="role"><option>Volunteer</option><option>Field Officer</option><option>Polling Agent</option><option>Observer</option></select><div className="fo-modal-actions"><button type="button" onClick={() => setShowVolunteerForm(false)}>Cancel</button><button className="primary">Add to roster</button></div></form></div>}
      </div>
      <style jsx>{styles}</style>
    </DashboardShell>
  );
}

function Stat({ label, value, detail, alert }) { return <div className={`fo-stat ${alert ? "alert" : ""}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Badge({ value }) { return <span className={`fo-badge ${String(value).toLowerCase()}`}>{value}</span>; }
function Panel({ title, action, onAction, children }) { return <section className="fo-panel"><div className="fo-panel-head"><h3>{title}</h3>{action && <button onClick={onAction}>{action} →</button>}</div>{children}</section>; }
function Readiness({ label, value }) { return <div className="fo-progress"><div><span>{label}</span><b>{value}%</b></div><div className="bar"><i style={{ width: `${value}%` }} /></div></div>; }
function Roster({ volunteers }) { return <Panel title="Volunteer Roster"><div className="fo-table">{volunteers.map(v => <div className="fo-table-row" key={v.id}><b>{v.id}</b><span>{v.name}</span><span>{v.role}</span><span>{v.area}</span><Badge value={v.status} /><span>{v.training}</span></div>)}</div></Panel>; }
function TaskList({ tasks, onComplete }) { return <Panel title="Task Assignment"><div className="fo-table">{tasks.map((t, i) => <div className="fo-table-row" key={t.title}><span><b>{t.title}</b><small>{t.area}</small></span><span>{t.assignee}</span><Badge value={t.priority} /><Badge value={t.status} /><button className="mini" disabled={t.status === "Completed"} onClick={() => onComplete(i)}>Complete</button></div>)}</div></Panel>; }
function Attendance() { return <div className="fo-grid"><Panel title="Today's Attendance"><Readiness label="Checked in" value={92} /><Readiness label="On duty" value={78} /><Readiness label="Missed check-in" value={8} /></Panel><Panel title="Check-in Methods"><div className="fo-methods"><div>📍 GPS <b>64%</b></div><div>▣ QR Code <b>28%</b></div><div>✓ Manual Approval <b>8%</b></div></div></Panel></div>; }
function IncidentList() { return <Panel title="Real-time Incident Reporting"><div className="fo-table">{incidents.map(i => <div className="fo-table-row" key={`${i.type}-${i.time}`}><span><b>{i.type}</b><small>{i.area} · {i.time}</small></span><Badge value={i.severity} /><span>{i.status}</span><button className="mini">Open</button></div>)}</div></Panel>; }
function Logistics() { return <Panel title="Campaign Logistics"><div className="fo-logistics">{[["Vehicles","12","Available"],["Fuel","840 L","In stock"],["Banners","320","In stock"],["Tablets","48","Assigned"],["Phones","76","Assigned"],["Megaphones","105","In stock"]].map(([a,b,c]) => <div key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div></Panel>; }
function Routes() { return <div className="fo-grid"><Panel title="AI Route Planning"><div className="fo-ai"><strong>✦ Recommended deployment</strong><p>Prioritize areas with staffing gaps and reduce travel time by grouping nearby polling stations into the same field route.</p><button className="primary">Generate optimized routes</button></div></Panel><Panel title="Offline Capability"><div className="fo-ai"><strong>Offline sync ready</strong><p>Field workers can capture check-ins, incidents and survey responses offline and synchronize when connectivity returns.</p><span className="fo-online">● Sync service ready</span></div></Panel></div>; }
function SimpleCards({ title, items }) { return <Panel title={title}><div className="fo-cards">{items.map(item => <div key={item}><span>✓</span><strong>{item}</strong><small>Configure and manage this operational area</small></div>)}</div></Panel>; }

const styles = `
.fo-page{max-width:1500px;margin:0 auto}.fo-topbar{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:18px}.fo-kicker{font-size:11px;letter-spacing:1.2px;font-weight:800;color:#66736b}.fo-topbar h2{margin:5px 0 4px;font-size:28px}.fo-topbar p{margin:0;color:#66736b}.fo-actions{display:flex;gap:8px;flex-wrap:wrap}.fo-actions button,.fo-modal button,.fo-panel-head button,.mini{border:1px solid #dce6df;background:#fff;border-radius:9px;padding:9px 12px;font-weight:700;color:#31523e;cursor:pointer}.primary{background:#075f2b!important;color:#fff!important;border-color:#075f2b!important}.fo-notice{background:#eaf5ee;border:1px solid #b9dcc5;color:#075f2b;padding:10px 14px;border-radius:10px;margin-bottom:14px}.fo-notice button{float:right;border:0;background:none;font-size:18px}.fo-tabs{display:flex;gap:6px;overflow:auto;padding-bottom:10px;margin-bottom:14px}.fo-tabs button{white-space:nowrap;border:1px solid #dce6df;background:#fff;padding:9px 12px;border-radius:9px;color:#526259;font-weight:700;cursor:pointer}.fo-tabs button.active{background:#075f2b;color:#fff;border-color:#075f2b}.fo-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:14px}.fo-stat,.fo-panel{background:#fff;border:1px solid #dce6df;border-radius:14px;box-shadow:0 4px 18px rgba(16,59,34,.05)}.fo-stat{padding:18px}.fo-stat span,.fo-stat small{display:block;color:#66736b}.fo-stat strong{display:block;font-size:30px;margin:7px 0}.fo-stat.alert strong{color:#b33a2e}.fo-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:14px;margin-bottom:14px}.fo-panel{padding:17px}.fo-panel-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.fo-panel h3{margin:0;font-size:16px}.fo-panel-head button{padding:5px 8px;font-size:12px}.fo-row,.fo-table-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-top:1px solid #edf1ee}.fo-row:first-child,.fo-table-row:first-child{border-top:0}.fo-row strong,.fo-row small{display:block}.fo-row small,.fo-table-row small{color:#738078;margin-top:3px}.fo-badge{font-size:11px;font-weight:800;border-radius:999px;padding:5px 8px;background:#edf2ef;color:#466052}.fo-badge.high{background:#fde8e5;color:#a42f25}.fo-badge.medium{background:#fff4d8;color:#8a6500}.fo-badge.low{background:#e8f3ec;color:#22633d}.fo-badge.active{background:#e8f3ec;color:#22633d}.fo-badge.completed{background:#e8f3ec;color:#22633d}.fo-map{height:250px;border-radius:12px;background:radial-gradient(circle at 50% 45%,#dcefe2 0,#eef5f0 36%,#e6ece8 37%,#f7f9f8 100%);position:relative;overflow:hidden}.map-center{position:absolute;inset:0;display:grid;place-items:center;color:#718078;font-weight:800;letter-spacing:1px;font-size:12px}.map-pin{position:absolute;background:#075f2b;color:#fff;border-radius:999px;padding:7px 10px;font-size:11px;font-weight:800;z-index:2}.p1{left:18%;top:35%}.p2{right:18%;top:28%}.p3{left:45%;bottom:24%}.fo-progress{margin:14px 0}.fo-progress>div:first-child{display:flex;justify-content:space-between;font-size:13px}.bar{height:8px;background:#e8eeea;border-radius:99px;margin-top:7px;overflow:hidden}.bar i{display:block;height:100%;background:#075f2b;border-radius:99px}.fo-readiness{padding-top:2px}.fo-table{width:100%;overflow:auto}.fo-table-row{min-width:720px}.fo-table-row>*{flex:1}.fo-table-row>b{max-width:100px}.fo-table-row .mini{flex:0 0 auto}.fo-methods{display:grid;gap:12px}.fo-methods div{display:flex;justify-content:space-between;padding:13px;border:1px solid #edf1ee;border-radius:10px}.fo-logistics{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.fo-logistics div,.fo-cards>div{border:1px solid #edf1ee;border-radius:11px;padding:14px}.fo-logistics span,.fo-logistics strong,.fo-logistics small{display:block}.fo-logistics strong{font-size:22px;margin:4px 0}.fo-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.fo-cards span{font-size:18px;color:#075f2b}.fo-cards strong,.fo-cards small{display:block}.fo-cards small{color:#718078;margin-top:5px}.fo-ai{border:1px solid #edf1ee;border-radius:11px;padding:16px}.fo-ai p{color:#66736b;line-height:1.5}.fo-online{color:#075f2b;font-weight:800}.fo-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:2000;display:grid;place-items:center;padding:20px}.fo-modal{background:#fff;border-radius:16px;padding:22px;width:min(440px,100%);box-shadow:0 20px 70px rgba(0,0,0,.2)}.fo-modal h3{margin-top:0}.fo-modal input,.fo-modal select{display:block;width:100%;box-sizing:border-box;margin:9px 0;padding:12px;border:1px solid #dce6df;border-radius:9px}.fo-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px}@media(max-width:900px){.fo-stats{grid-template-columns:repeat(2,1fr)}.fo-grid{grid-template-columns:1fr}.fo-cards{grid-template-columns:1fr 1fr}.fo-topbar{flex-direction:column}}@media(max-width:560px){.fo-stats{grid-template-columns:1fr 1fr}.fo-cards{grid-template-columns:1fr}.fo-actions{width:100%}.fo-actions button{flex:1}}
`;
