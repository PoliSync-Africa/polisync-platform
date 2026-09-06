"use client";

import { useEffect, useMemo, useState } from "react";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

async function api(path) {
  const token = getToken();
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Request failed (${response.status}).`);
  return Array.isArray(data.data) ? data.data : [];
}

const weatherText = (code) => {
  const map = { 0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy rain showers", 95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail" };
  return map[code] || "Weather conditions";
};

const weatherIcon = (code) => code === 0 ? "☀️" : [1, 2].includes(code) ? "🌤️" : [3].includes(code) ? "☁️" : [45, 48].includes(code) ? "🌫️" : [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code) ? "🌧️" : [95, 96, 99].includes(code) ? "⛈️" : "🌦️";

function extractCoordinates(item) {
  if (!item) return null;
  const lat = Number(item.latitude ?? item.lat ?? item.location?.latitude);
  const lon = Number(item.longitude ?? item.lon ?? item.lng ?? item.location?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

async function geocode(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to find that location.");
  const data = await response.json();
  const result = data?.results?.[0];
  if (!result) throw new Error("Location not found. Try a city, town, community or landmark name.");
  return { lat: Number(result.latitude), lon: Number(result.longitude), name: result.name, region: result.admin1 || result.country || "", country: result.country || "" };
}

async function loadForecast(coords) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation,rain,showers,cloud_cover");
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,precipitation,rain,weather_code,wind_speed_10m,relative_humidity_2m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,rain_sum,wind_speed_10m_max");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");
  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) throw new Error("Weather forecast is temporarily unavailable.");
  return response.json();
}

export default function WeatherIntelligence() {
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [level, setLevel] = useState("location");
  const [regionId, setRegionId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [stationId, setStationId] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api("/api/electoral-geography/regions").then((data) => { if (!cancelled) setRegions(data); }).catch(() => {}).finally(() => { if (!cancelled) setGeoLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setConstituencies([]); setStations([]); setConstituencyId(""); setStationId("");
    if (!regionId) return;
    api(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`).then(setConstituencies).catch((e) => setError(e.message));
  }, [regionId]);

  useEffect(() => {
    setStations([]); setStationId("");
    if (!constituencyId) return;
    api(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`).then(setStations).catch((e) => setError(e.message));
  }, [constituencyId]);

  const selectedRegion = useMemo(() => regions.find((item) => String(item._id) === String(regionId)), [regions, regionId]);
  const selectedConstituency = useMemo(() => constituencies.find((item) => String(item._id) === String(constituencyId)), [constituencies, constituencyId]);
  const selectedStation = useMemo(() => stations.find((item) => String(item._id) === String(stationId)), [stations, stationId]);

  const resolveSelection = async () => {
    setLoading(true); setError("");
    try {
      let coords = null; let name = ""; let region = ""; let country = "Ghana";
      if (level === "region" && selectedRegion) {
        coords = extractCoordinates(selectedRegion);
        name = selectedRegion.name; region = selectedRegion.name;
        if (!coords) { const result = await geocode(`${selectedRegion.name}, Ghana`); coords = result; }
      } else if (level === "constituency" && selectedConstituency) {
        coords = extractCoordinates(selectedConstituency);
        name = selectedConstituency.name; region = selectedRegion?.name || "";
        if (!coords) { const result = await geocode(`${selectedConstituency.name}, ${selectedRegion?.name || ""}, Ghana`); coords = result; }
      } else if (level === "polling_station" && selectedStation) {
        coords = extractCoordinates(selectedStation);
        name = selectedStation.name; region = selectedRegion?.name || "";
        if (!coords) { const result = await geocode(`${selectedStation.name}, ${selectedConstituency?.name || ""}, ${selectedRegion?.name || ""}, Ghana`); coords = result; }
      } else if (level === "location") {
        if (!query.trim()) throw new Error("Enter a location to search.");
        const result = await geocode(query.trim());
        coords = result; name = result.name; region = result.region; country = result.country;
      } else {
        throw new Error("Select a valid geographic level and location.");
      }
      const data = await loadForecast(coords);
      setPlace({ ...coords, name, region, country });
      setForecast(data);
    } catch (e) {
      setError(e.message || "Unable to load weather.");
    } finally { setLoading(false); }
  };

  const current = forecast?.current;
  const daily = forecast?.daily;
  const hourly = forecast?.hourly;
  const hourlyRows = useMemo(() => {
    if (!hourly?.time) return [];
    const start = Math.max(0, hourly.time.findIndex((time) => time >= (current?.time || "")));
    return hourly.time.slice(start < 0 ? 0 : start, (start < 0 ? 0 : start) + 12).map((time, index) => ({
      time, temp: hourly.temperature_2m?.[(start < 0 ? 0 : start) + index], rain: hourly.precipitation_probability?.[(start < 0 ? 0 : start) + index], code: hourly.weather_code?.[(start < 0 ? 0 : start) + index]
    }));
  }, [hourly, current]);

  return <section className="weather-intelligence">
    <div className="weather-hero"><div><span className="eyebrow">POLISYNC AFRICA • WEATHER INTELLIGENCE</span><h2>Search weather by location or electoral geography</h2><p>Check current conditions, rainfall risk, hourly patterns and a 7-day forecast for a specific place, region, constituency or polling station.</p></div><div className="hero-icon">🌦️</div></div>

    <div className="search-panel">
      <div className="level-tabs">{[["location","Location"],["region","Region"],["constituency","Constituency"],["polling_station","Polling Station"]].map(([value,label]) => <button key={value} type="button" className={level === value ? "active" : ""} onClick={() => { setLevel(value); setError(""); }}>{label}</button>)}</div>
      {level === "location" ? <div className="search-row"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") resolveSelection(); }} placeholder="Search a city, town, community or landmark…" /><button type="button" onClick={resolveSelection} disabled={loading}>{loading ? "Searching…" : "Search weather"}</button></div> : <div className="hierarchy-row">
        <select value={regionId} onChange={(e) => setRegionId(e.target.value)} disabled={geoLoading}><option value="">Select region</option>{regions.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}</select>
        {level !== "region" && <select value={constituencyId} onChange={(e) => setConstituencyId(e.target.value)} disabled={!regionId}><option value="">Select constituency</option>{constituencies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}
        {level === "polling_station" && <select value={stationId} onChange={(e) => setStationId(e.target.value)} disabled={!constituencyId}><option value="">Select polling station</option>{stations.map((s) => <option key={s._id} value={s._id}>{s.name}{s.pollingStationCode ? ` — ${s.pollingStationCode}` : ""}</option>)}</select>}
        <button type="button" onClick={resolveSelection} disabled={loading || (level === "region" ? !regionId : level === "constituency" ? !constituencyId : !stationId)}>{loading ? "Loading…" : "View forecast"}</button>
      </div>}
      {error && <div className="weather-error">{error}</div>}
    </div>

    {forecast && place && <>
      <div className="location-heading"><div><span>FORECAST LOCATION</span><h3>{place.name}</h3><p>{[place.region, place.country].filter(Boolean).join(", ")} • {forecast.timezone || "Local time"}</p></div><div className="coordinates">{place.lat.toFixed(4)}, {place.lon.toFixed(4)}</div></div>
      <div className="weather-kpis">
        <article><span>Current</span><strong>{Math.round(current.temperature_2m)}°C</strong><small>{weatherText(current.weather_code)}</small></article>
        <article><span>Feels like</span><strong>{Math.round(current.apparent_temperature)}°C</strong><small>Apparent temperature</small></article>
        <article><span>Rain probability</span><strong>{Math.max(...(daily?.precipitation_probability_max || [0]))}%</strong><small>Highest in 7 days</small></article>
        <article><span>Wind</span><strong>{Math.round(current.wind_speed_10m)} km/h</strong><small>{Math.round(current.wind_direction_10m)}° direction</small></article>
      </div>

      <div className="weather-grid">
        <section className="weather-card hourly-card"><div className="card-title"><div><span>WEATHER PATTERN</span><h3>Next 12 hours</h3></div><strong>{Math.round(current.relative_humidity_2m)}% humidity</strong></div><div className="hourly-list">{hourlyRows.map((row) => <div className="hour-row" key={row.time}><span>{new Date(row.time).toLocaleTimeString([], { hour: "numeric" })}</span><b>{weatherIcon(row.code)}</b><strong>{Math.round(row.temp)}°</strong><em>{row.rain ?? 0}% rain</em></div>)}</div></section>
        <section className="weather-card"><div className="card-title"><div><span>FORECAST</span><h3>7-day outlook</h3></div></div><div className="daily-list">{daily?.time?.map((date, i) => <div className="day-row" key={date}><span>{i === 0 ? "Today" : new Date(`${date}T12:00:00`).toLocaleDateString([], { weekday: "short" })}</span><b>{weatherIcon(daily.weather_code?.[i])}</b><small>{weatherText(daily.weather_code?.[i])}</small><strong>{Math.round(daily.temperature_2m_max?.[i] ?? 0)}° / {Math.round(daily.temperature_2m_min?.[i] ?? 0)}°</strong><em>{daily.precipitation_probability_max?.[i] ?? 0}%</em></div>)}</div></section>
      </div>
      <div className="weather-source">Forecast data: Open-Meteo. Electoral geography selection uses PoliSync Africa geography data; searched locations are resolved through global geocoding. Forecast values are guidance and should not be treated as emergency warnings.</div>
    </>}

    <style jsx>{`
      .weather-intelligence{display:grid;gap:14px}.weather-hero{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:26px;border-radius:20px;background:linear-gradient(135deg,#04351a,#075f2b);color:#fff;border:1px solid #c9a227}.eyebrow,.location-heading span,.card-title span{font-size:11px;letter-spacing:.08em;font-weight:800;opacity:.78}.weather-hero h2{margin:7px 0 5px;font-size:28px}.weather-hero p{margin:0;max-width:760px;color:#d9eee2}.hero-icon{font-size:56px}.search-panel,.weather-card,.location-heading{background:#fff;border:1px solid #dce6df;border-radius:16px;padding:16px}.level-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}.level-tabs button{border:1px solid #d6e1d9;background:#f7faf8;color:#315144;padding:9px 13px;border-radius:10px;font-weight:700;cursor:pointer}.level-tabs button.active{background:#075f2b;color:#fff;border-color:#075f2b}.search-row,.hierarchy-row{display:grid;grid-template-columns:1fr auto;gap:9px}.hierarchy-row{grid-template-columns:repeat(4,minmax(0,1fr))}.search-row input,.hierarchy-row select{width:100%;box-sizing:border-box;padding:12px;border:1px solid #d6e1d9;border-radius:10px;background:#fbfdfb;color:#1f2d25}.search-row button,.hierarchy-row button{border:0;border-radius:10px;padding:12px 17px;background:#075f2b;color:#fff;font-weight:800;cursor:pointer}.search-row button:disabled,.hierarchy-row button:disabled{opacity:.55;cursor:not-allowed}.weather-error{margin-top:10px;padding:10px;border-radius:9px;background:#fff4f4;border:1px solid #efcccc;color:#a00000;font-size:13px}.location-heading{display:flex;justify-content:space-between;align-items:center}.location-heading h3{margin:4px 0;font-size:22px}.location-heading p{margin:0;color:#6d7b73}.coordinates{font-size:12px;color:#7b877f}.weather-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.weather-kpis article{padding:16px;background:#fff;border:1px solid #dce6df;border-radius:14px}.weather-kpis span,.weather-kpis small{display:block;color:#718078;font-size:12px}.weather-kpis strong{display:block;font-size:27px;color:#075f2b;margin:5px 0}.weather-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:12px}.card-title{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}.card-title h3{margin:4px 0 0;font-size:18px}.card-title>strong{font-size:12px;color:#075f2b;background:#edf8f1;padding:7px 9px;border-radius:9px}.hourly-list,.daily-list{display:grid}.hour-row,.day-row{display:grid;align-items:center;border-top:1px solid #edf1ee;padding:9px 0;gap:7px}.hour-row{grid-template-columns:60px 32px 50px 1fr}.day-row{grid-template-columns:60px 30px 1fr 100px 42px}.hour-row span,.day-row span,.hour-row em,.day-row em{font-size:12px;color:#6d7b73;font-style:normal}.hour-row b,.day-row b{font-size:20px}.hour-row strong,.day-row strong{font-size:13px}.day-row small{color:#6d7b73}.weather-source{font-size:11px;color:#75827b;padding:4px 2px 20px}@media(max-width:850px){.hierarchy-row,.weather-grid{grid-template-columns:1fr}.weather-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.day-row{grid-template-columns:52px 28px 1fr 92px 38px}.weather-hero h2{font-size:23px}}@media(max-width:560px){.weather-hero{padding:20px}.hero-icon{display:none}.search-row,.weather-kpis{grid-template-columns:1fr}.level-tabs{display:grid;grid-template-columns:1fr 1fr}.level-tabs button{width:100%}.location-heading{align-items:flex-start;flex-direction:column}.coordinates{margin-top:6px}.day-row{grid-template-columns:45px 26px 1fr 78px 35px;font-size:11px}.day-row small{display:none}.hour-row{grid-template-columns:52px 30px 45px 1fr}}
    `}</style>
  </section>;
}
