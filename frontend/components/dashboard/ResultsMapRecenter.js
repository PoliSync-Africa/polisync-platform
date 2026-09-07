"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
export default function ResultsMapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { duration: 0.6 }); }, [map, center, zoom]);
  return null;
}
