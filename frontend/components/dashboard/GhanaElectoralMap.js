"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GHANA_CENTER = [7.9465, -1.0232];
const GHANA_ZOOM = 6;

const REGION_CENTERS = {
  Ahafo: [7.03, -2.49], Ashanti: [6.75, -1.52], Bono: [7.76, -2.34], "Bono East": [7.78, -1.06],
  Central: [5.55, -1.08], Eastern: [6.45, -0.45], "Greater Accra": [5.72, -0.18], "North East": [10.55, -0.37],
  Northern: [9.40, -1.00], Oti: [7.85, 0.35], Savannah: [9.05, -1.82], "Upper East": [10.78, -0.86],
  "Upper West": [10.25, -2.20], Volta: [7.10, 0.30], Western: [5.65, -2.15], "Western North": [6.35, -2.75],
};

function getCoords(item) {
  if (!item) return null;
  const gps = item.gps || item.location || {};
  const lat = Number(item.latitude ?? item.lat ?? gps.latitude);
  const lon = Number(item.longitude ?? item.lon ?? item.lng ?? gps.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lon)) return [lat, lon];
  return REGION_CENTERS[item.name] || null;
}

function MapViewport({ location }) {
  const map = useMap();

  useEffect(() => {
    if (location?.coords) map.flyTo(location.coords, location.zoom || GHANA_ZOOM, { duration: 0.65 });
    else map.setView(GHANA_CENTER, GHANA_ZOOM, { animate: false });
  }, [location, map]);

  useEffect(() => {
    const resize = () => map.invalidateSize({ pan: false, animate: false });
    const timer = window.setTimeout(resize, 80);
    window.addEventListener("resize", resize);
    window.addEventListener("orientationchange", resize);
    const container = map.getContainer();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(container);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      observer?.disconnect();
    };
  }, [map]);

  return null;
}

export default function GhanaElectoralMap({ locations = [] }) {
  const plotted = useMemo(() => locations.map((item) => ({ item, coords: getCoords(item) })).filter((x) => x.coords), [locations]);
  const last = plotted[plotted.length - 1];

  return (
    <div className="ghana-map-shell">
      <MapContainer center={GHANA_CENTER} zoom={GHANA_ZOOM} minZoom={5} maxZoom={17} scrollWheelZoom className="ghana-map">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport location={last ? { coords: last.coords, zoom: last.item.level === "polling_station" ? 15 : last.item.level === "constituency" ? 11 : 8 } : null} />
        {plotted.map(({ item, coords }, index) => (
          <CircleMarker
            key={`${item.id || item._id || item.name}-${index}`}
            center={coords}
            radius={item.level === "polling_station" ? 7 : item.level === "constituency" ? 10 : 13}
            pathOptions={{
              color: item.level === "polling_station" ? "#c9a227" : "#075f2b",
              fillColor: item.level === "polling_station" ? "#c9a227" : "#075f2b",
              fillOpacity: 0.82,
              weight: 3,
            }}
          >
            <Tooltip direction="top" offset={[0, -5]}>{item.name}</Tooltip>
            <Popup>
              <strong>{item.name}</strong><br />
              <span>{item.level === "polling_station" ? "Polling Station" : item.level === "constituency" ? "Constituency" : "Region"}</span>
              {item.code ? <><br /><small>{item.code}</small></> : null}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="map-badge">POLISYNC • GHANA ELECTORAL MAP</div>
      <div className="map-hint">Drag • Zoom • Select a marker</div>
      <style jsx>{`
        .ghana-map-shell{position:relative;width:100%;height:clamp(360px,52vw,560px);min-height:330px;overflow:hidden;border:1px solid #d4af37;border-radius:18px;background:#e9f0eb;box-sizing:border-box}
        .ghana-map{width:100%;height:100%;z-index:1}
        .map-badge,.map-hint{position:absolute;z-index:500;box-shadow:0 5px 18px rgba(0,0,0,.15)}
        .map-badge{top:12px;left:12px;padding:8px 11px;border-radius:9px;background:rgba(4,53,26,.92);color:#fff;font-size:9px;font-weight:900;letter-spacing:1px}
        .map-hint{left:50%;bottom:12px;transform:translateX(-50%);padding:7px 10px;border-radius:999px;background:rgba(255,255,255,.94);color:#244936;font-size:10px;font-weight:800;white-space:nowrap}
        @media(max-width:640px){.ghana-map-shell{height:390px;min-height:330px;border-radius:14px}.map-badge{font-size:8px}.map-hint{font-size:9px;max-width:calc(100% - 24px);overflow:hidden;text-overflow:ellipsis}}
      `}</style>
    </div>
  );
}
