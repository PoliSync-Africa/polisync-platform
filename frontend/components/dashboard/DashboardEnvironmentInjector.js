"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const DASHBOARD_PATHS = ["/dashboard", "/party", "/observer", "/presidential-candidate", "/parliamentary-candidate", "/command-center", "/war-room", "/super-admin"];
const isDashboardPath = (pathname = "") => DASHBOARD_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

function flagFor(code) { return code ? code.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : "🌍"; }
function weatherText(code) { const map = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Light drizzle",53:"Drizzle",55:"Heavy drizzle",61:"Light rain",63:"Rain",65:"Heavy rain",71:"Light snow",73:"Snow",75:"Heavy snow",80:"Rain showers",81:"Rain showers",82:"Heavy showers",95:"Thunderstorm",96:"Thunderstorm",99:"Thunderstorm"}; return map[code] || "Current conditions"; }

export default function DashboardEnvironmentInjector() {
  const pathname = usePathname();
  const [target, setTarget] = useState(null);
  const [clock, setClock] = useState(new Date());
  const [data, setData] = useState({loading:true,location:"Locating…",country:"",flag:"🌍",temperature:null,condition:""});

  useEffect(() => { const timer=window.setInterval(()=>setClock(new Date()),1000); return()=>window.clearInterval(timer); }, []);

  useEffect(() => {
    if (!isDashboardPath(pathname)) { setTarget(null); return undefined; }
    let attempts=0; let timer=null;
    const findTarget=()=>{
      const hero=document.querySelector(".polisync-dashboard .hero");
      if (!hero) { if(attempts++<30) timer=window.setTimeout(findTarget,100); return; }
      // Personal dashboard already has the live data block; other dashboard heroes receive it here.
      if (hero.querySelector(".about-data")) { setTarget(null); return; }
      const host=hero.querySelector(".dashboard-environment-host");
      setTarget(host||hero);
      hero.classList.add("dashboard-environment-moved");
    };
    findTarget();
    return()=>{ if(timer)window.clearTimeout(timer); document.querySelectorAll(".dashboard-environment-moved").forEach((el)=>el.classList.remove("dashboard-environment-moved")); setTarget(null); };
  }, [pathname]);

  useEffect(() => {
    if (!isDashboardPath(pathname) || !navigator.geolocation) return undefined;
    let cancelled=false;
    const load=({coords})=>{
      const {latitude,longitude}=coords;
      Promise.all([
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,{cache:"no-store"}),
        fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,{cache:"no-store"})
      ]).then(async([g,w])=>{
        const geo=g.ok?await g.json():{}; const weather=w.ok?await w.json():{}; if(cancelled)return;
        const code=String(geo.countryCode||geo.countryCodeIso2||"").toUpperCase();
        const locality=geo.locality||geo.city||geo.principalSubdivision||"Current location";
        const region=geo.principalSubdivision&&geo.principalSubdivision!==locality?`, ${geo.principalSubdivision}`:"";
        setData({loading:false,location:`${locality}${region}`,country:geo.countryName||"",flag:flagFor(code),temperature:weather?.current?.temperature_2m??null,condition:weatherText(weather?.current?.weather_code)});
      }).catch(()=>{if(!cancelled)setData(x=>({...x,loading:false,location:"Location unavailable"}));});
    };
    navigator.geolocation.getCurrentPosition(load,()=>setData(x=>({...x,loading:false,location:"Location permission not granted"})),{enableHighAccuracy:true,maximumAge:0,timeout:12000});
    return()=>{cancelled=true};
  }, [pathname]);

  if(!target || !isDashboardPath(pathname)) return null;
  const dateText=clock.toLocaleDateString("en-GH",{weekday:"short",day:"numeric",month:"short",year:"numeric"});
  const timeText=clock.toLocaleTimeString("en-GH",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true});
  const content=<><div className="dashboard-environment-data" aria-label="Live dashboard environment data"><div><span>📍</span><section><small>LOCATION</small><strong>{data.loading?"Locating…":data.location}{data.country?`, ${data.country}`:""}</strong></section></div><div><span>☀️</span><section><small>WEATHER</small><strong>{data.temperature==null?"--°C":`${Math.round(data.temperature)}°C`} · {data.condition||"Current conditions"}</strong></section></div><div><span>🕒</span><section><small>LOCAL TIME</small><strong>{timeText}</strong></section></div><div><span>📅</span><section><small>DATE</small><strong>{dateText}</strong></section></div></div><style jsx global>{`.dashboard-environment-moved .dashboard-country-line,.dashboard-environment-moved .dashboard-weather{display:none!important}.dashboard-environment-moved .hero>div:first-child>p{display:none!important}.dashboard-environment-data{display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:10px;width:100%;margin-top:16px}.dashboard-environment-data>div{display:flex;align-items:center;gap:9px;min-width:0;padding:10px 12px;border:1px solid rgba(255,255,255,.2);border-radius:13px;background:rgba(255,255,255,.08)}.dashboard-environment-data>div>span{font-size:17px;flex:0 0 auto}.dashboard-environment-data small{display:block;color:#c9a227;font-size:8px;font-weight:900;letter-spacing:1px}.dashboard-environment-data strong{display:block;margin-top:3px;color:#fff;font-size:10px;line-height:1.3;overflow-wrap:anywhere}@media(max-width:980px){.dashboard-environment-data{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.dashboard-environment-data{grid-template-columns:1fr}.dashboard-environment-data>div{padding:9px 10px}}`}</style></>;
  return createPortal(content,target);
}
