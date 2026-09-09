"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function token() {
  if (typeof window === "undefined") return "";
  return ["polisync_token", "authToken", "accessToken", "token"].map((k) => localStorage.getItem(k) || sessionStorage.getItem(k)).find(Boolean) || "";
}

async function api(path) {
  const r = await fetch(`${API_BASE}${path}`, { cache: "no-store", headers: { Accept: "application/json", ...(token() ? { Authorization: `Bearer ${token()}` } : {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok || body.success === false) throw new Error(body.message || `Request failed (${r.status}).`);
  const value = body.data ?? body.regions ?? body.constituencies ?? body.pollingStations ?? body.stations ?? body.results ?? body;
  return Array.isArray(value) ? value : [];
}

function id(x) { return String(x?._id ?? x?.id ?? x?.regionId ?? x?.constituencyId ?? x?.pollingStationId ?? ""); }
function name(x) { return x?.name || x?.regionName || x?.constituencyName || x?.pollingStationName || x?.stationName || x?.pollingStation || "Unnamed location"; }
function coords(x) {
  if (!x) return null;
  const lat = Number(x.latitude ?? x.lat ?? x.location?.latitude ?? x.coordinates?.latitude ?? x.coordinates?.lat ?? x.geo?.latitude ?? x.geo?.lat);
  const lon = Number(x.longitude ?? x.lon ?? x.lng ?? x.location?.longitude ?? x.coordinates?.longitude ?? x.coordinates?.lon ?? x.coordinates?.lng ?? x.geo?.longitude ?? x.geo?.lon ?? x.geo?.lng);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function geocode(query) {
  const q = query.trim();
  if (!q) throw new Error("Enter a location to search.");
  const open = new URL("https://geocoding-api.open-meteo.com/v1/search");
  open.searchParams.set("name", q.replace(/,\s*Ghana$/i, "")); open.searchParams.set("count", "10"); open.searchParams.set("language", "en"); open.searchParams.set("format", "json"); open.searchParams.set("countryCode", "GH");
  let results = [];
  try { const r = await fetch(open.toString(), { cache: "no-store" }); if (r.ok) results = (await r.json())?.results || []; } catch (_) {}
  if (!results.length) {
    const nom = new URL("https://nominatim.openstreetmap.org/search");
    nom.searchParams.set("q", /ghana/i.test(q) ? q : `${q}, Ghana`); nom.searchParams.set("format", "jsonv2"); nom.searchParams.set("addressdetails", "1"); nom.searchParams.set("limit", "10"); nom.searchParams.set("countrycodes", "gh");
    try { const r = await fetch(nom.toString(), { cache: "no-store", headers: { Accept: "application/json" } }); if (r.ok) results = (await r.json()).map((x) => ({ latitude: x.lat, longitude: x.lon, name: x.name || x.display_name, admin1: x.address?.state || x.address?.region, country: x.address?.country || "Ghana", display: x.display_name })); } catch (_) {}
  }
  return results.filter((x) => Number.isFinite(Number(x.latitude)) && Number.isFinite(Number(x.longitude))).map((x) => ({ lat: Number(x.latitude), lon: Number(x.longitude), name: x.name || x.display || q, region: x.admin1 || "Ghana", country: x.country || "Ghana" }));
}

async function forecast(c) {
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.searchParams.set("latitude", c.lat); u.searchParams.set("longitude", c.lon); u.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,rain,showers,cloud_cover");
  u.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,relative_humidity_2m");
  u.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max"); u.searchParams.set("forecast_days", "7"); u.searchParams.set("timezone", "auto");
  const r = await fetch(u.toString(), { cache: "no-store" }); if (!r.ok) throw new Error("Weather forecast is temporarily unavailable."); return r.json();
}

const text = (c) => ({0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Rain showers",82:"Heavy rain showers",95:"Thunderstorm",96:"Thunderstorm with hail",99:"Thunderstorm with hail"}[c] || "Weather conditions");
const icon = (c) => c === 0 ? "☀️" : [1,2].includes(c) ? "🌤️" : c === 3 ? "☁️" : [45,48].includes(c) ? "🌫️" : [51,53,55,61,63,65,80,81,82].includes(c) ? "🌧️" : [95,96,99].includes(c) ? "⛈️" : "🌦️";

export default function WeatherIntelligenceV2() {
  const [regions,setRegions]=useState([]), [constituencies,setConstituencies]=useState([]), [stations,setStations]=useState([]);
  const [level,setLevel]=useState("location"), [regionId,setRegionId]=useState(""), [constituencyId,setConstituencyId]=useState(""), [stationId,setStationId]=useState(""), [query,setQuery]=useState("");
  const [matches,setMatches]=useState([]), [place,setPlace]=useState(null), [data,setData]=useState(null), [loading,setLoading]=useState(false), [geoLoading,setGeoLoading]=useState(true), [error,setError]=useState("");

  useEffect(()=>{let dead=false; api("/api/electoral-geography/regions").then((x)=>!dead&&setRegions(x)).catch((e)=>!dead&&setError(e.message)).finally(()=>!dead&&setGeoLoading(false)); return()=>{dead=true};},[]);
  useEffect(()=>{setConstituencies([]);setStations([]);setConstituencyId("");setStationId("");if(!regionId)return;api(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`).then(setConstituencies).catch((e)=>setError(e.message));},[regionId]);
  useEffect(()=>{setStations([]);setStationId("");if(!constituencyId)return;api(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`).then(setStations).catch((e)=>setError(e.message));},[constituencyId]);

  const region=useMemo(()=>regions.find((x)=>id(x)===String(regionId)),[regions,regionId]);
  const constituency=useMemo(()=>constituencies.find((x)=>id(x)===String(constituencyId)),[constituencies,constituencyId]);
  const station=useMemo(()=>stations.find((x)=>id(x)===String(stationId)),[stations,stationId]);

  async function resolve() {
    setLoading(true);setError("");setMatches([]);
    try {
      let c=null, p=null;
      if(level==="location") {
        const found=await geocode(query); if(!found.length) throw new Error("Location not found in Ghana. Try a city, town, community, suburb or landmark name.");
        if(found.length>1){setMatches(found);setLoading(false);return;} p=found[0];c=found[0];
      } else {
        const selected=level==="region"?region:level==="constituency"?constituency:station;
        if(!selected) throw new Error("Select a location first.");
        c=coords(selected);
        const context=[name(selected),level!=="region"?name(region):"",level==="polling_station"?name(constituency):"", "Ghana"].filter(Boolean).join(", ");
        if(!c){ const found=await geocode(context); if(found.length){c=found[0];} else { const parent=coords(region); if(parent)c=parent; } }
        if(!c) throw new Error(`Coordinates are unavailable for ${name(selected)}. Try the Location search with the place or nearby community name.`);
        p={...c,name:name(selected),region:name(region)||"Ghana",country:"Ghana"};
      }
      setPlace(p);setData(await forecast(c));
    } catch(e){setError(e.message||"Unable to load weather.");} finally{setLoading(false);}
  }
  async function choose(m){setMatches([]);setLoading(true);try{setPlace(m);setData(await forecast(m));}catch(e){setError(e.message);}finally{setLoading(false);}}

  const current=data?.current, daily=data?.daily, hourly=data?.hourly;
  const rows=useMemo(()=>{if(!hourly?.time)return[];const i=Math.max(0,hourly.time.findIndex(t=>t>=(current?.time||"")));return hourly.time.slice(i,i+12).map((t,n)=>({t,temp:hourly.temperature_2m?.[i+n],rain:hourly.precipitation_probability?.[i+n],code:hourly.weather_code?.[i+n]}));},[hourly,current]);

  return <section className="wi">
    <div className="hero"><div><span>POLISYNC AFRICA • WEATHER INTELLIGENCE</span><h2>Weather by location and electoral geography</h2><p>Search Ghanaian cities, towns, communities and landmarks, or select a region, constituency or polling station.</p></div><b>🌦️</b></div>
    <div className="panel"><div className="tabs">{[["location","Location"],["region","Region"],["constituency","Constituency"],["polling_station","Polling Station"]].map(([v,l])=><button key={v} className={level===v?"active":""} onClick={()=>{setLevel(v);setError("");setMatches([])}}>{l}</button>)}</div>
      {level==="location"?<div className="row"><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&resolve()} placeholder="Accra, Techiman, Tamale, Nkoranza, community or landmark…"/><button onClick={resolve} disabled={loading}>{loading?"Searching…":"Search weather"}</button></div>:<div className="row"><select value={regionId} onChange={e=>setRegionId(e.target.value)} disabled={geoLoading}><option value="">Select region</option>{regions.map(r=><option key={id(r)} value={id(r)}>{name(r)}</option>)}</select>{level!=="region"&&<select value={constituencyId} onChange={e=>setConstituencyId(e.target.value)} disabled={!regionId}><option value="">Select constituency</option>{constituencies.map(c=><option key={id(c)} value={id(c)}>{name(c)}</option>)}</select>}{level==="polling_station"&&<select value={stationId} onChange={e=>setStationId(e.target.value)} disabled={!constituencyId}><option value="">Select polling station</option>{stations.map(s=><option key={id(s)} value={id(s)}>{name(s)}{s.pollingStationCode?` — ${s.pollingStationCode}`:""}</option>)}</select>}<button onClick={resolve} disabled={loading||!((level==="region"&&regionId)||(level==="constituency"&&constituencyId)||(level==="polling_station"&&stationId))}>{loading?"Loading…":"View forecast"}</button></div>}
      {matches.length>0&&<div className="matches"><strong>Select the location that matches:</strong>{matches.map((m,i)=><button key={`${m.lat}-${m.lon}-${i}`} onClick={()=>choose(m)}><b>{m.name}</b><span>{[m.region,m.country].filter(Boolean).join(", ")} · {m.lat.toFixed(4)}, {m.lon.toFixed(4)}</span></button>)}</div>}
      {error&&<div className="error">{error}</div>}
    </div>
    {data&&place&&<><div className="location"><div><span>FORECAST LOCATION</span><h3>{place.name}</h3><p>{[place.region,place.country].filter(Boolean).join(", ")} · {data.timezone||"Local time"}</p></div><b>{place.lat.toFixed(4)}, {place.lon.toFixed(4)}</b></div>
      <div className="kpis"><article><span>Current</span><strong>{Math.round(current.temperature_2m)}°C</strong><small>{text(current.weather_code)}</small></article><article><span>Feels like</span><strong>{Math.round(current.apparent_temperature)}°C</strong><small>Apparent temperature</small></article><article><span>Rain probability</span><strong>{Math.max(...(daily?.precipitation_probability_max||[0]))}%</strong><small>Highest in 7 days</small></article><article><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} km/h</strong><small>{Math.round(current.wind_direction_10m)}° direction</small></article></div>
      <div className="grid"><section className="card"><div className="title"><div><span>NEXT 12 HOURS</span><h3>Hourly pattern</h3></div><b>{Math.round(current.relative_humidity_2m)}% humidity</b></div>{rows.map(r=><div className="hour" key={r.t}><span>{new Date(r.t).toLocaleTimeString([], {hour:"numeric"})}</span><b>{icon(r.code)}</b><strong>{Math.round(r.temp)}°</strong><em>{r.rain??0}% rain</em></div>)}</section><section className="card"><div className="title"><div><span>7-DAY FORECAST</span><h3>Outlook</h3></div></div>{daily?.time?.map((d,i)=><div className="day" key={d}><span>{i===0?"Today":new Date(`${d}T12:00:00`).toLocaleDateString([], {weekday:"short"})}</span><b>{icon(daily.weather_code?.[i])}</b><small>{text(daily.weather_code?.[i])}</small><strong>{Math.round(daily.temperature_2m_max?.[i]??0)}° / {Math.round(daily.temperature_2m_min?.[i]??0)}°</strong><em>{daily.precipitation_probability_max?.[i]??0}%</em></div>)}</section></div>
      <div className="source">Forecast: Open-Meteo. Electoral selections use PoliSync geography data. When a geography record has no coordinates, the resolver uses its parent geography or a Ghana-focused geocoder.</div>
    </>}
    <style jsx>{`.wi{display:grid;gap:14px}.hero{display:flex;justify-content:space-between;gap:20px;align-items:center;padding:25px;border-radius:18px;background:linear-gradient(135deg,#04351a,#075f2b);color:#fff;border:1px solid #c9a227}.hero span,.location span,.title span{font-size:10px;letter-spacing:.1em;font-weight:900;opacity:.75}.hero h2{margin:7px 0;font-size:28px}.hero p{margin:0;color:#d8ede0}.hero>b{font-size:52px}.panel,.card,.location{background:#fff;border:1px solid #dce6df;border-radius:15px;padding:15px}.tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:11px}.tabs button,.row button{border:1px solid #d4e0d9;background:#f7faf8;color:#315144;padding:10px 13px;border-radius:9px;font-weight:800;cursor:pointer}.tabs .active,.row button{background:#075f2b;color:#fff;border-color:#075f2b}.row{display:grid;grid-template-columns:1fr auto;gap:8px}.row select,.row input{width:100%;box-sizing:border-box;border:1px solid #d6e1db;border-radius:9px;background:#fbfdfc;padding:11px;color:#17392b;font-size:16px}.matches{display:grid;gap:7px;margin-top:12px}.matches>button{display:grid;text-align:left;gap:3px;padding:10px;border:1px solid #d8e4dd;border-radius:9px;background:#f8fbf9;cursor:pointer}.matches span{font-size:11px;color:#718078}.error{margin-top:10px;padding:10px;border-radius:9px;background:#fff0f0;color:#9d3434;font-weight:700;font-size:12px}.location{display:flex;justify-content:space-between;align-items:center}.location h3{margin:5px 0;color:#174e35}.location p{margin:0;color:#718078;font-size:11px}.location>b{font-size:12px;color:#718078}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.kpis article{background:#fff;border:1px solid #dce6df;border-radius:13px;padding:14px;display:grid;gap:4px}.kpis span,.kpis small{font-size:10px;color:#718078}.kpis strong{font-size:25px;color:#075d2e}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px}.title h3{margin:4px 0;color:#174e35}.hour,.day{display:grid;grid-template-columns:70px 35px 55px 1fr;gap:7px;align-items:center;padding:8px 0;border-top:1px solid #edf2ef;font-size:11px}.hour em,.day em{font-style:normal;text-align:right;color:#48705a}.day{grid-template-columns:55px 30px 1fr 80px 40px}.day small{color:#718078}.source{font-size:10px;color:#718078;padding:4px 2px}@media(max-width:850px){.kpis{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr}}@media(max-width:600px){.hero{display:block}.hero>b{display:block;margin-top:10px}.row{grid-template-columns:1fr}.location{display:grid;gap:8px}.kpis{grid-template-columns:1fr 1fr}.day{grid-template-columns:45px 25px 1fr}.day strong{grid-column:3}.day em{grid-column:3;text-align:left}.hour{grid-template-columns:55px 30px 45px 1fr}}`}</style>
  </section>;
}
