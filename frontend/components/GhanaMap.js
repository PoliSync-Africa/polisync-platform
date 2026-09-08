"use client";

import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GHANA_CENTER = [7.9465, -1.0232];
const BOUNDARY_URL = "https://services2.arcgis.com/4WiMNWDUQZIvdL5U/arcgis/rest/services/GhanaDistNew/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&outSR=4326&f=geojson";
const API_BASE = String(process.env.NEXT_PUBLIC_API_URL || "https://polisync-platform-1.onrender.com").replace(/\/+$/, "");

function FitBounds({ data }) {
  const map = useMap();
  useEffect(() => {
    if (!data?.features?.length) return;
    const layer = window.L?.geoJSON ? window.L.geoJSON(data) : null;
    if (layer?.getBounds?.().isValid()) map.fitBounds(layer.getBounds(), { padding: [18, 18] });
    else map.setView(GHANA_CENTER, 6);
    const resize = () => map.invalidateSize({ pan: false, animate: false });
    const timer = window.setTimeout(resize, 120);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    return () => { window.clearTimeout(timer); window.removeEventListener("resize", resize); window.removeEventListener("orientationchange", resize); };
  }, [data, map]);
  return null;
}

function featureName(feature) {
  const p = feature?.properties || {};
  return String(p.REGION || p.Region || p.region || p.NAME_1 || p.NAME || p.name || "Ghana region").trim();
}

export default function GhanaMap() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [regionCount, setRegionCount] = useState(16);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [boundaryResponse, regionResponse] = await Promise.all([
          fetch(BOUNDARY_URL, { cache: "no-store", headers: { Accept: "application/geo+json,application/json" } }),
          fetch(`${API_BASE}/api/electoral-geography/regions`, { cache: "no-store", headers: { Accept: "application/json" } }),
        ]);
        if (!boundaryResponse.ok) throw new Error("Ghana regional boundaries could not be loaded.");
        const geojson = await boundaryResponse.json();
        const regionJson = regionResponse.ok ? await regionResponse.json().catch(() => ({})) : {};
        if (!cancelled) {
          setData(geojson);
          const regions = Array.isArray(regionJson?.data) ? regionJson.data : [];
          setRegionCount(regions.length || geojson?.features?.length || 16);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load Ghana regional boundaries.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const regions = useMemo(() => data?.features || [], [data]);
  const style = (feature) => {
    const name = featureName(feature);
    const active = selected === name;
    return { color: active ? "#c59d20" : "#ffffff", weight: active ? 3 : 1.3, fillColor: active ? "#08713a" : "#4d9b63", fillOpacity: active ? 0.88 : 0.7 };
  };
  const onEachFeature = (feature, layer) => {
    const name = featureName(feature);
    layer.on({ mouseover: () => layer.setStyle({ weight: 3, color: "#e0bd48", fillOpacity: 0.88 }), mouseout: () => layer.setStyle(style(feature)), click: () => setSelected(name) });
    layer.bindTooltip(name, { sticky: true, direction: "center", className: "ghana-region-label" });
  };

  return <section className="ghana-map-card" aria-label="Interactive Ghana 16-region map">
    <div className="map-heading"><div><span className="eyebrow">GHANA ELECTORAL GEOGRAPHY</span><h2>Interactive Ghana Regional Map</h2><p>Current 16-region administrative boundaries. Tap a region to select it.</p></div><span className="region-count">{regionCount} regions</span></div>
    {error && <div className="map-error">{error}</div>}
    <div className="map-shell">{loading ? <div className="map-loading">Loading Ghana regional boundaries…</div> : <MapContainer center={GHANA_CENTER} zoom={6} minZoom={5} maxZoom={12} scrollWheelZoom className="ghana-map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FitBounds data={data}/>{regions.map((feature,index) => <GeoJSON key={`${featureName(feature)}-${index}`} data={feature} style={style(feature)} onEachFeature={onEachFeature}><Popup><strong>{featureName(feature)}</strong><br/>Current Ghana electoral region.</Popup><Tooltip>{featureName(feature)}</Tooltip></GeoJSON>)}</MapContainer>}
      <div className="map-badge">POLISYNC • GHANA</div><div className="map-hint">Drag • Zoom • Tap a region</div>
    </div>
    <div className="region-strip">{regions.map((feature,index) => { const name=featureName(feature); return <button key={`${name}-${index}`} type="button" className={selected===name?"selected":""} onClick={()=>setSelected(name)}>{name}</button>; })}</div>
    <style jsx>{`.ghana-map-card{width:100%;background:#fff;border:1px solid #dbe5df;border-radius:16px;padding:14px;box-sizing:border-box}.map-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.eyebrow{display:block;color:#075f2b;font-size:9px;font-weight:900;letter-spacing:1.3px}.map-heading h2{margin:5px 0 3px;color:#123c29;font-size:20px}.map-heading p{margin:0;color:#64746b;font-size:11px}.region-count{padding:7px 9px;border-radius:999px;background:#edf7f0;color:#075f2b;font-size:10px;font-weight:900;white-space:nowrap}.map-error{margin-bottom:9px;padding:9px;border-radius:8px;background:#fff2f2;color:#9d3030;font-size:11px}.map-shell{position:relative;width:100%;height:clamp(380px,45vw,600px);overflow:hidden;border:1px solid #cfdcd4;border-radius:12px;background:#eaf1ec}.ghana-map{width:100%;height:100%;z-index:1}.map-loading{height:100%;display:grid;place-items:center;color:#567163;font-size:12px}.map-badge,.map-hint{position:absolute;z-index:500;box-shadow:0 4px 14px rgba(0,0,0,.13)}.map-badge{top:10px;left:10px;padding:7px 9px;border-radius:8px;background:rgba(4,53,26,.92);color:#fff;font-size:8px;font-weight:900;letter-spacing:.9px}.map-hint{bottom:10px;left:50%;transform:translateX(-50%);padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.95);color:#244936;font-size:9px;font-weight:800;white-space:nowrap}.region-strip{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.region-strip button{border:1px solid #d8e3dc;border-radius:999px;background:#f7faf8;color:#31533f;padding:6px 8px;font-size:9px;font-weight:800;cursor:pointer}.region-strip button.selected{background:#08713a;color:#fff;border-color:#c59d20}@media(max-width:620px){.ghana-map-card{padding:10px}.map-heading{display:block}.region-count{display:inline-block;margin-top:8px}.map-shell{height:390px}.map-hint{max-width:calc(100% - 20px);overflow:hidden;text-overflow:ellipsis}.region-strip{max-height:120px;overflow:auto}}`}</style>
  </section>;
}
