"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GHANA_CENTER = [7.9465, -1.0232];
const GHANA_ZOOM = 6;

function MapViewport({ location }) {
  const map = useMap();
  useEffect(() => {
    if (!location) {
      map.setView(GHANA_CENTER, GHANA_ZOOM, { animate: true });
      return;
    }
    map.flyTo([location.lat, location.lon], location.zoom || 11, { duration: 0.8 });
  }, [location, map]);
  return null;
}

export default function GhanaElectoralMap({ locations = [] }) {
  return (
    <div className="ghana-map-shell">
      <MapContainer center={GHANA_CENTER} zoom={GHANA_ZOOM} minZoom={5} maxZoom={17} scrollWheelZoom className="ghana-map">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport location={locations[locations.length - 1]} />
        {locations.map((item, index) => (
          <CircleMarker
            key={`${item.id || item.name}-${index}`}
            center={[item.lat, item.lon]}
            radius={item.level === "polling_station" ? 8 : item.level === "constituency" ? 11 : 14}
            pathOptions={{
              color: "#075f2b",
              fillColor: item.level === "polling_station" ? "#c9a227" : "#075f2b",
              fillOpacity: 0.85,
              weight: 3,
            }}
          >
            <Popup>
              <strong>{item.name}</strong>
              <br />
              <span>{item.level === "polling_station" ? "Polling Station" : item.level === "constituency" ? "Constituency" : "Region"}</span>
              {item.code ? <><br /><small>{item.code}</small></> : null}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      <div className="map-badge">GHANA • ELECTORAL MAP</div>
      <style jsx>{`
        .ghana-map-shell{position:relative;width:100%;height:520px;overflow:hidden;border:1px solid #d4af37;border-radius:18px;background:#e9f0eb}
        .ghana-map{width:100%;height:100%;z-index:1}
        .map-badge{position:absolute;z-index:500;top:12px;left:12px;padding:8px 11px;border-radius:9px;background:rgba(4,53,26,.92);color:#fff;font-size:9px;font-weight:900;letter-spacing:1px;box-shadow:0 4px 16px rgba(0,0,0,.16)}
        @media(max-width:640px){.ghana-map-shell{height:430px}.map-badge{font-size:8px}}
      `}</style>
    </div>
  );
}
