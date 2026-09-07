"use client";
import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function ResultsMapRecenter({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 0.6 });
  }, [map, center, zoom]);

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
