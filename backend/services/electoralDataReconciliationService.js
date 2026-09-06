const fs = require("fs");
const path = require("path");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const SOURCE_FILE = path.join(__dirname, "../data/ghana_polling_stations_2024.csv");

function normalize(value) { return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(); }
function key(value) { return normalize(value).toLowerCase().replace(/[’'`]/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function parseCSVLine(line) { const out=[]; let value="", quoted=false; for(let i=0;i<line.length;i++){const ch=line[i]; if(ch==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(ch===','&&!quoted){out.push(value);value="";}else value+=ch;} out.push(value); return out; }
function readSource() {
  if (!fs.existsSync(SOURCE_FILE)) throw new Error(`EC polling-station CSV not found: ${SOURCE_FILE}`);
  const lines=fs.readFileSync(SOURCE_FILE,"utf8").split(/\r?\n/).filter(Boolean);
  if(lines.length<2) throw new Error("EC polling-station CSV contains no records.");
  const headers=parseCSVLine(lines[0]).map(normalize);
  const required=["polling_station_code","polling_station_name","constituency","district","region"];
  const missing=required.filter(h=>!headers.includes(h));
  if(missing.length) throw new Error(`Missing EC CSV columns: ${missing.join(", ")}`);
  const rows=lines.slice(1).map(parseCSVLine).map(values=>Object.fromEntries(headers.map((h,i)=>[h,normalize(values[i])] )));
  const records=rows.filter(r=>r.polling_station_code);
  const codes=new Map(); records.forEach(r=>{const c=normalize(r.polling_station_code).toUpperCase(); codes.set(c,(codes.get(c)||0)+1);});
  const duplicateCodes=[...codes.entries()].filter(([,n])=>n>1).map(([code,count])=>({code,count}));
  const blankRequired=rows.filter(r=>required.some(h=>!r[h])).length;
  return { rows:records, sourceRows:rows.length, duplicateCodes, blankRequired };
}

async function buildReconciliationPlan() {
  const source=readSource();
  const [regions,constituencies,stations]=await Promise.all([
    Region.find({isActive:true}).select("_id name regionNumber").lean(),
    Constituency.find({isActive:true}).select("_id name regionId").lean(),
    PollingStation.find({}).select("_id pollingStationCode name regionId constituencyId district sourceYear isActive").lean(),
  ]);
  if(regions.length!==16) throw new Error(`Expected 16 active regions; found ${regions.length}.`);
  if(constituencies.length<276) throw new Error(`Expected at least 276 active constituencies; found ${constituencies.length}.`);
  if(source.duplicateCodes.length) throw new Error(`Source validation failed: ${source.duplicateCodes.length} duplicate polling-station codes detected.`);
  if(source.blankRequired) throw new Error(`Source validation failed: ${source.blankRequired} rows have missing required fields.`);

  const regionByName=new Map(regions.map(r=>[key(r.name),r]));
  const regionNameById=new Map(regions.map(r=>[String(r._id),key(r.name)]));
  const constituencyByName=new Map();
  constituencies.forEach(c=>{const k=key(c.name);const list=constituencyByName.get(k)||[];list.push(c);constituencyByName.set(k,list);});
  const stationByCode=new Map(stations.filter(s=>s.pollingStationCode).map(s=>[normalize(s.pollingStationCode).toUpperCase(),s]));
  const seen=new Set();
  const plan={newStations:[],changedStations:[],unchangedStations:0,sourceMissingActiveStations:[],unresolvedRows:[],summary:{sourceRows:source.rows.length,existingStations:stations.length,sourceUniqueCodes:source.rows.length,newStations:0,changedStations:0,unchangedStations:0,missingActiveStations:0,unresolvedRows:0}};

  for(const row of source.rows){
    const code=normalize(row.polling_station_code).toUpperCase(); if(seen.has(code)) continue; seen.add(code);
    const region=regionByName.get(key(row.region));
    const options=constituencyByName.get(key(row.constituency))||[];
    const constituency=options.find(c=>regionNameById.get(String(c.regionId))===key(row.region)) || (options.length===1?options[0]:null);
    if(!region||!constituency){plan.unresolvedRows.push({code,name:row.polling_station_name,region:row.region,constituency:row.constituency,reason:!region?"Region not found":options.length>1?"Constituency name is ambiguous":"Constituency not found"});continue;}
    const existing=stationByCode.get(code);
    if(!existing){plan.newStations.push({code,name:row.polling_station_name,regionId:region._id,constituencyId:constituency._id,district:row.district});continue;}
    const changes={};
    if(existing.name!==row.polling_station_name) changes.name={from:existing.name,to:row.polling_station_name};
    if(String(existing.regionId)!==String(region._id)) changes.regionId={from:existing.regionId,to:region._id};
    if(String(existing.constituencyId)!==String(constituency._id)) changes.constituencyId={from:existing.constituencyId,to:constituency._id};
    if(normalize(existing.district)!==normalize(row.district)) changes.district={from:existing.district,to:row.district};
    if(existing.isActive!==true) changes.isActive={from:existing.isActive,to:true};
    if(Object.keys(changes).length) plan.changedStations.push({id:existing._id,code,changes}); else plan.unchangedStations++;
  }

  const sourceCodes=new Set(source.rows.map(r=>normalize(r.polling_station_code).toUpperCase()));
  for(const station of stations){const code=normalize(station.pollingStationCode).toUpperCase(); if(station.isActive===true && code && !sourceCodes.has(code)) plan.sourceMissingActiveStations.push({id:station._id,code,name:station.name,regionId:station.regionId,constituencyId:station.constituencyId});}
  plan.summary.newStations=plan.newStations.length; plan.summary.changedStations=plan.changedStations.length; plan.summary.unchangedStations=plan.unchangedStations; plan.summary.missingActiveStations=plan.sourceMissingActiveStations.length; plan.summary.unresolvedRows=plan.unresolvedRows.length;
  plan.safeToApply=plan.summary.unresolvedRows===0 && plan.summary.missingActiveStations===0;
  return plan;
}
module.exports={buildReconciliationPlan,SOURCE_FILE};
