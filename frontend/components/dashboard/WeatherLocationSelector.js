"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const DEFAULT_WEATHER = { loading: false, place: "Current location", temperature: null, condition: "", humidity: null, wind: null, daily: [], hourly: [] };

export default function WeatherLocationSelector() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("region");
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedConstituency, setSelectedConstituency] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState([]);
  const [weather, setWeather] = useState(DEFAULT_WEATHER);
  const [error, setError] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);

  const token = typeof window !== "undefined" ? (localStorage.getItem("polisync_token") || localStorage.getItem("authToken") || localStorage.getItem("accessToken") || localStorage.getItem("token")) : null;
  const authHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}`, Accept: "application/json" } : { Accept: "application/json" }, [token]);

  useEffect(() => {
    if (!open || regions.length) return;
    let cancelled = false;
    setLoadingOptions(true);
    fetch(`${API_URL}/api/electoral-geography/regions`, { headers: authHeaders, cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Regions could not be loaded.")))
      .then((body) => { if (!cancelled) setRegions(body?.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoadingOptions(false); });
    return () => { cancelled = true; };
  }, [open, regions.length, authHeaders]);

  useEffect(() => {
    if (!selectedRegion) { setConstituencies([]); setSelectedConstituency(""); return; }
    let cancelled = false;
    fetch(`${API_URL}/api/electoral-geography/regions/${encodeURIComponent(selectedRegion)}/constituencies`, { headers: authHeaders, cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Constituencies could not be loaded.")))
      .then((body) => { if (!cancelled) setConstituencies(body?.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [selectedRegion, authHeaders]);

  useEffect(() => {
    if (!selectedConstituency) { setStations([]); setSelectedStation(""); return; }
    let cancelled = false;
    fetch(`${API_URL}/api/electoral-geography/constituencies/${encodeURIComponent(selectedConstituency)}/polling-stations`, { headers: authHeaders, cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Polling stations could not be loaded.")))
      .then((body) => { if (!cancelled) setStations(body?.data || []); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [selectedConstituency, authHeaders]);

  useEffect(() => {
    if (mode !== "location" || query.trim().length < 3) { setPlaces([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
        url.searchParams.set("name", query.trim());
        url.searchParams.set("count", "8");
        url.searchParams.set("language", "en");
        url.searchParams.set("format", "json");
        const response = await fetch(url.toString(), { signal: controller.signal, cache: "no-store" });
        const body = response.ok ? await response.json() : {};
        setPlaces(body?.results || []);
      } catch (e) {
        if (e.name !== "AbortError") setError("Location search is unavailable right now.");
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, mode]);

  const fetchWeather = async (place) => {
    if (!place?.latitude || !place?.longitude) return;
    setError("");
    setWeather((current) => ({ ...current, loading: true }));
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(place.latitude));
      url.searchParams.set("longitude", String(place.longitude));
      url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
      url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code");
      url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
      url.searchParams.set("forecast_days", "7");
      url.searchParams.set("timezone", "auto");
      url.searchParams.set("temperature_unit", "celsius");
      url.searchParams.set("wind_speed_unit", "kmh");
      const response = await fetch(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error("The weather service could not be reached.");
      const data = await response.json();
      const current = data.current || {};
      setWeather({ loading: false, place: place.label || place.name || "Selected location", temperature: current.temperature_2m ?? null, condition: codeToText(current.weather_code), humidity: current.relative_humidity_2m ?? null, wind: current.wind_speed_10m ?? null, daily: buildDaily(data), hourly: buildHourly(data) });
    } catch (e) {
      setError(e.message || "Weather is unavailable for this location.");
      setWeather((current) => ({ ...current, loading: false }));
    }
  };

  const geocodePlace = async (name, context = "Ghana") => {
    try {
      const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
      url.searchParams.set("name", `${name}, ${context}`);
      url.searchParams.set("count", "1");
      url.searchParams.set("language", "en");
      url.searchParams.set("format", "json");
      const response = await fetch(url.toString(), { cache: "no-store" });
      const body = response.ok ? await response.json() : {};
      return body?.results?.[0] || null;
    } catch { return null; }
  };

  const chooseHierarchy = async (kind, item) => {
    setMode(kind);
    setError("");
    if (kind === "region") {
      setSelectedRegion(String(item._id));
      const place = await geocodePlace(item.name, "Ghana");
      if (place) await fetchWeather({ ...place, label: `${item.name}, Ghana` });
    } else if (kind === "constituency") {
      setSelectedConstituency(String(item._id));
      const region = regions.find((r) => String(r._id) === String(selectedRegion));
      const place = await geocodePlace(item.name, region?.name ? `${region.name}, Ghana` : "Ghana");
      if (place) await fetchWeather({ ...place, label: `${item.name}${region?.name ? `, ${region.name}` : ""}, Ghana` });
    } else {
      setSelectedStation(String(item._id));
      const constituency = constituencies.find((c) => String(c._id) === String(selectedConstituency));
      const region = regions.find((r) => String(r._id) === String(selectedRegion));
      const context = [constituency?.name, region?.name, "Ghana"].filter(Boolean).join(", ");
      const place = await geocodePlace(item.name, context);
      if (place) await fetchWeather({ ...place, label: `${item.name}, ${context}` });
      else setError("This polling station does not have coordinates yet. Search the exact location below to view its forecast.");
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) { setError("Location services are not supported on this device."); return; }
    setError("");
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const place = await reverseGeocode(coords.latitude, coords.longitude);
      await fetchWeather({ latitude: coords.latitude, longitude: coords.longitude, label: place || "Current location" });
    }, () => setError("Location permission was not granted."), { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  };

  return (
    <div className="weather-selector-wrap">
      <button type="button" className="weather-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Choose weather location">
        <span className="weather-trigger-icon">{weather.loading ? "…" : iconFor(weather.condition)}</span>
        <span><strong>{weather.temperature == null ? "--°C" : `${Math.round(weather.temperature)}°C`}</strong><small>{weather.place}</small></span>
        <span className="weather-trigger-arrow">⌄</span>
      </button>
      {open && <div className="weather-panel">
        <div className="weather-panel-head"><div><span>WEATHER INTELLIGENCE</span><h3>Forecast location</h3></div><button type="button" onClick={() => setOpen(false)}>×</button></div>
        <div className="weather-tabs">{[["region","Region"],["constituency","Constituency"],["station","Polling Station"],["location","Location"]].map(([value,label]) => <button key={value} type="button" className={mode === value ? "active" : ""} onClick={() => { setMode(value); setError(""); }}>{label}</button>)}</div>

        {mode === "region" && <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); const item = regions.find((r) => String(r._id) === e.target.value); if (item) chooseHierarchy("region", item); }}><option value="">Select a region</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select>}
        {mode === "constituency" && <><select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}><option value="">Select region first</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select><select value={selectedConstituency} onChange={(e) => { setSelectedConstituency(e.target.value); const item = constituencies.find((c) => String(c._id) === e.target.value); if (item) chooseHierarchy("constituency", item); }} disabled={!selectedRegion}><option value="">Select constituency</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></>}
        {mode === "station" && <><select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}><option value="">Select region first</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select><select value={selectedConstituency} onChange={(e) => setSelectedConstituency(e.target.value)} disabled={!selectedRegion}><option value="">Select constituency</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select><select value={selectedStation} onChange={(e) => { setSelectedStation(e.target.value); const item = stations.find((s) => String(s._id) === e.target.value); if (item) chooseHierarchy("station", item); }} disabled={!selectedConstituency}><option value="">Select polling station</option>{stations.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.pollingStationCode})</option>)}</select></>}
        {mode === "location" && <><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search any city, town, community or place…" /><div className="place-results">{places.map((place) => <button type="button" key={`${place.id}-${place.latitude}`} onClick={() => { fetchWeather({ ...place, label: [place.name, place.admin1, place.country].filter(Boolean).join(", ") }); setQuery(""); setPlaces([]); }}><strong>{place.name}</strong><span>{[place.admin2, place.admin1, place.country].filter(Boolean).join(", ")}</span></button>)}</div><button type="button" className="current-location" onClick={useCurrentLocation}>⌖ Use my current location</button></>}
        {loadingOptions && <p className="muted">Loading electoral locations…</p>}
        {error && <p className="error">{error}</p>}

        <div className="weather-summary"><div><span>{iconFor(weather.condition)}</span><strong>{weather.loading ? "Loading…" : weather.temperature == null ? "--°C" : `${Math.round(weather.temperature)}°C`}</strong><small>{weather.condition || "Select a location"} · {weather.place}</small></div><div className="weather-meta"><span>Humidity {weather.humidity == null ? "--" : `${Math.round(weather.humidity)}%`}</span><span>Wind {weather.wind == null ? "--" : `${Math.round(weather.wind)} km/h`}</span></div></div>
        {weather.daily.length > 0 && <div className="forecast-list"><div className="forecast-title">7-day forecast</div>{weather.daily.map((day) => <div className="forecast-row" key={day.date}><span>{day.day}</span><span>{iconFor(day.condition)}</span><span>{day.condition}</span><strong>{day.max}° / {day.min}°</strong><small>{day.rain}%</small></div>)}</div>}
        <div className="weather-source">Forecast data: Open-Meteo. Location selection uses PoliSync electoral geography and global geocoding.</div>
      </div>}
      <style jsx>{`.weather-selector-wrap{position:relative}.weather-trigger{display:flex;align-items:center;gap:7px;min-width:150px;max-width:250px;padding:6px 8px;border:1px solid #dce6df;border-radius:10px;background:#fff;color:#075f2b;cursor:pointer;text-align:left}.weather-trigger-icon{font-size:20px;line-height:1}.weather-trigger span:nth-child(2){display:flex;flex-direction:column;min-width:0}.weather-trigger strong{font-size:12px;line-height:1.1}.weather-trigger small{max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#78837c;font-size:7px;margin-top:2px}.weather-trigger-arrow{margin-left:auto;color:#87928b;font-size:13px}.weather-panel{position:absolute;right:0;top:calc(100% + 9px);z-index:1600;width:min(430px,calc(100vw - 24px));padding:14px;border:1px solid #dce6df;border-radius:15px;background:#fff;box-shadow:0 18px 45px rgba(16,59,34,.18)}.weather-panel-head{display:flex;justify-content:space-between;gap:10px}.weather-panel-head span{color:#c9a227;font-size:8px;font-weight:900;letter-spacing:1px}.weather-panel-head h3{margin:3px 0 0;color:#075f2b;font-size:16px}.weather-panel-head button{width:30px;height:30px;border:1px solid #e2e9e4;border-radius:8px;background:#fff;color:#657169;font-size:20px}.weather-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:13px 0}.weather-tabs button{padding:8px 4px;border:1px solid #e1e9e4;border-radius:8px;background:#fff;color:#66716a;font-size:8px;font-weight:800;cursor:pointer}.weather-tabs button.active{background:#075f2b;color:#fff;border-color:#075f2b}.weather-panel select,.weather-panel input{width:100%;box-sizing:border-box;margin-top:7px;padding:10px 11px;border:1px solid #dfe7e1;border-radius:9px;background:#fff;color:#334139;font-size:11px;outline:none}.place-results{max-height:150px;overflow:auto;margin-top:5px}.place-results button{display:flex;flex-direction:column;width:100%;padding:9px;border:0;border-bottom:1px solid #edf1ee;background:#fff;text-align:left;cursor:pointer}.place-results strong{color:#334139;font-size:10px}.place-results span{color:#8a938d;font-size:8px;margin-top:2px}.current-location{width:100%;margin-top:8px;padding:9px;border:1px solid #dce6df;border-radius:8px;background:#f3f8f4;color:#075f2b;font-size:9px;font-weight:800}.muted,.error{font-size:9px}.muted{color:#7a857e}.error{padding:8px 9px;border-radius:8px;background:#fff5f5;color:#a32121}.weather-summary{display:flex;justify-content:space-between;gap:12px;margin-top:13px;padding:12px;border-radius:10px;background:#f6faf7}.weather-summary>div:first-child{display:grid;grid-template-columns:28px auto;column-gap:7px;align-items:center}.weather-summary>div:first-child span{font-size:22px;grid-row:span 2}.weather-summary strong{color:#075f2b;font-size:20px}.weather-summary small{grid-column:2;color:#758078;font-size:8px;max-width:190px}.weather-meta{display:flex;flex-direction:column;gap:4px;align-items:flex-end;color:#68746c;font-size:8px}.forecast-list{margin-top:12px}.forecast-title{margin-bottom:6px;color:#334139;font-size:10px;font-weight:850}.forecast-row{display:grid;grid-template-columns:55px 24px minmax(0,1fr) auto 30px;gap:5px;align-items:center;padding:7px 6px;border-top:1px solid #edf1ee;color:#657169;font-size:8px}.forecast-row strong{color:#075f2b;font-size:8px}.forecast-row small{text-align:right;color:#7c8880}.weather-source{margin-top:10px;color:#9aa29d;font-size:7px;line-height:1.4}@media(max-width:700px){.weather-trigger{min-width:82px;max-width:130px}.weather-trigger small{display:none}.weather-panel{right:-4px}.weather-tabs{grid-template-columns:repeat(2,1fr)}}`}</style>
    </div>
  );
}

async function reverseGeocode(latitude, longitude) {
  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    const response = await fetch(url.toString(), { cache: "no-store" });
    const body = response.ok ? await response.json() : {};
    const p = body?.results?.[0];
    return p ? [p.name, p.admin1, p.country].filter(Boolean).join(", ") : null;
  } catch { return null; }
}

function buildDaily(data) {
  const d = data?.daily;
  if (!d?.time) return [];
  return d.time.map((date, i) => ({ date, day: formatDay(date), condition: codeToText(d.weather_code?.[i]), max: round(d.temperature_2m_max?.[i]), min: round(d.temperature_2m_min?.[i]), rain: d.precipitation_probability_max?.[i] == null ? "--" : Math.round(d.precipitation_probability_max[i]) })).filter(Boolean);
}
function buildHourly(data) {
  const h = data?.hourly;
  if (!h?.time) return [];
  return h.time.slice(0, 12).map((time, i) => ({ time, temperature: round(h.temperature_2m?.[i]), rain: h.precipitation_probability?.[i], condition: codeToText(h.weather_code?.[i]) }));
}
function round(value) { return value == null || Number.isNaN(Number(value)) ? "--" : Math.round(Number(value)); }
function formatDay(date) { try { return new Intl.DateTimeFormat("en-GH", { weekday: "short" }).format(new Date(`${date}T12:00:00`)); } catch { return date; } }
function codeToText(code) { const n = Number(code); if (n === 0) return "Clear sky"; if ([1,2].includes(n)) return "Partly cloudy"; if (n === 3) return "Overcast"; if ([45,48].includes(n)) return "Fog"; if ([51,53,55,56,57].includes(n)) return "Drizzle"; if ([61,63,65,66,67,80,81,82].includes(n)) return "Rain"; if ([71,73,75,77,85,86].includes(n)) return "Snow"; if ([95,96,99].includes(n)) return "Thunderstorm"; return "Weather"; }
function iconFor(condition) { const c = String(condition || "").toLowerCase(); if (c.includes("thunder")) return "⛈️"; if (c.includes("rain") || c.includes("drizzle")) return "🌧️"; if (c.includes("cloud") || c.includes("overcast")) return "⛅"; if (c.includes("fog")) return "🌫️"; return "☀️"; }
