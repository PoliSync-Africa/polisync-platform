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
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
    };
  }, [data, map]);
  return null;
}

function featureName(feature) {
  const p = feature?.properties || {};
  return String(p.REGION || p.Region || p.region || p.NAME_1 || p.NAME || p.name || "Ghana region").trim();
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function constituencyName(item) {
  return String(item?.name || item?.constituencyName || "Constituency").trim();
}

export default function GhanaMap() {
  const [data, setData] = useState(null);
  const [regionsData, setRegionsData] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [selected, setSelected] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [regionCount, setRegionCount] = useState(16);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [boundaryResponse, regionResponse, constituencyResponse] = await Promise.all([
          fetch(BOUNDARY_URL, { cache: "no-store", headers: { Accept: "application/geo+json,application/json" } }),
          fetch(`${API_BASE}/api/electoral-geography/regions`, { cache: "no-store", headers: { Accept: "application/json" } }),
          fetch(`${API_BASE}/api/electoral-geography/constituencies`, { cache: "no-store", headers: { Accept: "application/json" } }),
        ]);
        if (!boundaryResponse.ok) throw new Error("Ghana regional boundaries could not be loaded.");
        const geojson = await boundaryResponse.json();
        const regionJson = regionResponse.ok ? await regionResponse.json().catch(() => ({})) : {};
        const constituencyJson = constituencyResponse.ok ? await constituencyResponse.json().catch(() => ({})) : {};
        const regionRows = Array.isArray(regionJson?.data) ? regionJson.data : [];
        const constituencyRows = Array.isArray(constituencyJson?.data) ? constituencyJson.data : [];
        if (!cancelled) {
          setData(geojson);
          setRegionsData(regionRows);
          setConstituencies(constituencyRows);
          setRegionCount(regionRows.length || geojson?.features?.length || 16);
          if (constituencyRows.length < 276) {
            setError(`Only ${constituencyRows.length.toLocaleString()} active constituencies are currently available; 276 are expected.`);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Unable to load Ghana electoral geography.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const regions = useMemo(() => data?.features || [], [data]);
  const regionLookup = useMemo(() => {
    const map = new Map();
    regionsData.forEach((region) => {
      map.set(normalize(region.name), region);
      if (region.slug) map.set(normalize(region.slug), region);
    });
    return map;
  }, [regionsData]);
  const grouped = useMemo(() => {
    const map = new Map();
    constituencies.forEach((constituency) => {
      const key = String(constituency.regionId || "");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(constituency);
    });
    map.forEach((items) => items.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))));
    return map;
  }, [constituencies]);
  const selectedRegion = selectedRegionId ? regionsData.find((r) => String(r._id || r.id) === String(selectedRegionId)) : null;
  const selectedConstituencies = selectedRegionId ? (grouped.get(String(selectedRegionId)) || []) : [];

  const selectRegion = (name) => {
    setSelected(name);
    const region = regionLookup.get(normalize(name));
    setSelectedRegionId(region ? String(region._id || region.id) : "");
  };

  const style = (feature) => {
    const name = featureName(feature);
    const active = selected === name;
    return { color: active ? "#c59d20" : "#ffffff", weight: active ? 3 : 1.3, fillColor: active ? "#08713a" : "#4d9b63", fillOpacity: active ? 0.88 : 0.7 };
  };

  const onEachFeature = (feature, layer) => {
    const name = featureName(feature);
    const region = regionLookup.get(normalize(name));
    const rows = region ? (grouped.get(String(region._id || region.id)) || []) : [];
    layer.on({
      mouseover: () => layer.setStyle({ weight: 3, color: "#e0bd48", fillOpacity: 0.88 }),
      mouseout: () => layer.setStyle(style(feature)),
      click: () => selectRegion(name),
    });
    layer.bindTooltip(`${name} • ${rows.length} constituencies`, { sticky: true, direction: "center", className: "ghana-region-label" });
  };

  return <section className="ghana-map-card" aria-label="Interactive Ghana 16-region map with all 276 constituencies">
    <div className="map-heading">
      <div><span className="eyebrow">GHANA ELECTORAL GEOGRAPHY</span><h2>Interactive Ghana Regional & Constituency Map</h2><p>All active constituencies are loaded from PoliSync's electoral geography registry and grouped under their current geographical region.</p></div>
      <div className="map-counts"><span>{regionCount} regions</span><span className={constituencies.length >= 276 ? "good" : "warn"}>{constituencies.length.toLocaleString()} / 276 constituencies</span></div>
    </div>
    {error && <div className="map-error">{error}</div>}
    <div className="map-shell">
      {loading ? <div className="map-loading">Loading Ghana regions and 276-constituency registry…</div> : <MapContainer center={GHANA_CENTER} zoom={6} minZoom={5} maxZoom={12} scrollWheelZoom className="ghana-map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FitBounds data={data}/>{regions.map((feature,index) => <GeoJSON key={`${featureName(feature)}-${index}`} data={feature} style={style(feature)} onEachFeature={onEachFeature}><Popup maxWidth={360}><strong>{featureName(feature)}</strong><br/><span>{(regionLookup.get(normalize(featureName(feature))) ? (grouped.get(String(regionLookup.get(normalize(featureName(feature)))._id || regionLookup.get(normalize(featureName(feature))).id)) || []).length : 0)} constituencies in this region</span>{regionLookup.get(normalize(featureName(feature))) && <div className="popup-list">{(grouped.get(String(regionLookup.get(normalize(featureName(feature)))._id || regionLookup.get(normalize(featureName(feature))).id)) || []).map((item, index) => <div key={String(item._id || item.id || index)}><b>{item.constituencyNumber ? `${item.constituencyNumber}. ` : ""}</b>{constituencyName(item)}</div>)}</div>}</Popup><Tooltip>{featureName(feature)}</Tooltip></GeoJSON>)}</MapContainer>}
      <div className="map-badge">POLISYNC • GHANA</div><div className="map-hint">Drag • Zoom • Tap a region to explore its constituencies</div>
    </div>
    <div className="region-strip">{regions.map((feature,index) => { const name=featureName(feature); const region=regionLookup.get(normalize(name)); const count=region ? (grouped.get(String(region._id || region.id)) || []).length : 0; return <button key={`${name}-${index}`} type="button" className={selected===name?"selected":""} onClick={()=>selectRegion(name)}>{name}<small>{count}</small></button>; })}</div>
    {selectedRegion && <section className="constituency-explorer"><div className="explorer-head"><div><span>SELECTED REGION</span><h3>{selectedRegion.name}</h3></div><strong>{selectedConstituencies.length} constituencies</strong></div><div className="constituency-grid">{selectedConstituencies.map((item,index)=><button key={String(item._id || item.id || index)} type="button"><span>{item.constituencyNumber || index + 1}</span><b>{constituencyName(item)}</b><small>{item.district || "Ghana"}</small></button>)}</div></section>}
    <style jsx>{`.ghana-map-card{width:100%;background:#fff;border:1px solid #dbe5df;border-radius:16px;padding:14px;box-sizing:border-box}.map-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.eyebrow,.explorer-head span{display:block;color:#075f2b;font-size:9px;font-weight:900;letter-spacing:1.3px}.map-heading h2{margin:5px 0 3px;color:#123c29;font-size:20px}.map-heading p{margin:0;color:#64746b;font-size:11px;line-height:1.45}.map-counts{display:flex;flex-direction:column;gap:6px;align-items:flex-end}.map-counts span{padding:7px 9px;border-radius:999px;background:#edf7f0;color:#075f2b;font-size:10px;font-weight:900;white-space:nowrap}.map-counts .warn{background:#fff2dc;color:#a45d08}.map-error{margin-bottom:9px;padding:9px;border-radius:8px;background:#fff2f2;color:#9d3030;font-size:11px}.map-shell{position:relative;width:100%;height:clamp(380px,45vw,600px);overflow:hidden;border:1px solid #cfdcd4;border-radius:12px;background:#eaf1ec}.ghana-map{width:100%;height:100%;z-index:1}.map-loading{height:100%;display:grid;place-items:center;color:#567163;font-size:12px}.map-badge,.map-hint{position:absolute;z-index:500;box-shadow:0 4px 14px rgba(0,0,0,.13)}.map-badge{top:10px;left:10px;padding:7px 9px;border-radius:8px;background:rgba(4,53,26,.92);color:#fff;font-size:8px;font-weight:900;letter-spacing:.9px}.map-hint{bottom:10px;left:50%;transform:translateX(-50%);padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.95);color:#244936;font-size:9px;font-weight:800;white-space:nowrap}.region-strip{display:flex;flex-wrap:wrap;gap:5px;margin-top:9px}.region-strip button{display:flex;align-items:center;gap:5px;border:1px solid #d8e3dc;border-radius:999px;background:#f7faf8;color:#31533f;padding:6px 8px;font-size:9px;font-weight:800;cursor:pointer}.region-strip button small{padding:2px 4px;border-radius:999px;background:#e4eee8;color:#456453;font-size:8px}.region-strip button.selected{background:#08713a;color:#fff;border-color:#c59d20}.region-strip button.selected small{background:rgba(255,255,255,.18);color:#fff}.constituency-explorer{margin-top:12px;border:1px solid #d8e5dc;border-radius:13px;background:#f8fbf9;overflow:hidden}.explorer-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:13px 14px;border-bottom:1px solid #e4ece7}.explorer-head h3{margin:4px 0 0;color:#123c29;font-size:16px}.explorer-head strong{padding:7px 9px;border-radius:999px;background:#e4f3e9;color:#08713a;font-size:9px}.constituency-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:10px}.constituency-grid button{display:grid;grid-template-columns:24px 1fr;gap:3px 7px;align-items:center;text-align:left;border:1px solid #e0e9e4;border-radius:9px;background:#fff;padding:8px;cursor:pointer}.constituency-grid button>span{grid-row:1/3;width:24px;height:24px;display:grid;place-items:center;border-radius:7px;background:#eaf5ee;color:#08713a;font-size:8px;font-weight:900}.constituency-grid b{font-size:9px;color:#30483a}.constituency-grid small{font-size:8px;color:#8a958f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.popup-list{margin-top:7px;max-height:190px;overflow:auto;border-top:1px solid #e8eee9;padding-top:5px}.popup-list div{padding:3px 0;border-bottom:1px solid #f0f3f1;font-size:9px;color:#30483a}.popup-list b{color:#08713a}.good{background:#e4f3e9!important;color:#08713a!important}@media(max-width:760px){.ghana-map-card{padding:10px}.map-heading{display:block}.map-counts{align-items:flex-start;margin-top:8px}.map-counts span{display:inline-block;margin-right:5px}.map-shell{height:390px}.map-hint{max-width:calc(100% - 20px);overflow:hidden;text-overflow:ellipsis}.constituency-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:440px){.constituency-grid{grid-template-columns:1fr}}`}</style>
  </section>;
}
