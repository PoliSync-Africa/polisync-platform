"use client";

import { useEffect, useMemo, useState } from "react";

const getToken = () => typeof window === "undefined" ? "" : localStorage.getItem("polisync_token") || sessionStorage.getItem("polisync_token") || localStorage.getItem("token") || sessionStorage.getItem("token") || localStorage.getItem("authToken") || sessionStorage.getItem("authToken") || localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken") || "";

async function request(path) {
  const token = getToken();
  if (!token) throw new Error("Authentication required. Please log in again.");
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json", Authorization: `Bearer ${token}` } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) throw new Error(data.message || `Unable to load location data (${response.status}).`);
  return Array.isArray(data.data) ? data.data : [];
}

const weatherUrl = (latitude, longitude) => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
  url.searchParams.set("hourly", "temperature_2m,apparent_temperature,precipitation_probability,weather_code");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("forecast_days", "7");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("temperature_unit", "celsius");
  url.searchParams.set("wind_speed_unit", "kmh");
  return url.toString();
};

export default function WeatherForecastExplorer() {
  const [regions, setRegions] = useState([]);
  const [constituencies, setConstituencies] = useState([]);
  const [stations, setStations] = useState([]);
  const [regionId, setRegionId] = useState("");
  const [constituencyId, setConstituencyId] = useState("");
  const [stationId, setStationId] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    request("/api/electoral-geography/regions")
      .then((data) => { if (!cancelled) setRegions(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Unable to load regions."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setConstituencies([]);
    setStations([]);
    setConstituencyId("");
    setStationId("");
    setError("");
    if (!regionId) return;
    request(`/api/electoral-geography/regions/${encodeURIComponent(regionId)}/constituencies`)
      .then((data) => { if (!cancelled) setConstituencies(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Unable to load constituencies."); });
    return () => { cancelled = true; };
  }, [regionId]);

  useEffect(() => {
    let cancelled = false;
    setStations([]);
    setStationId("");
    setError("");
    if (!constituencyId) return;
    request(`/api/electoral-geography/constituencies/${encodeURIComponent(constituencyId)}/polling-stations`)
      .then((data) => { if (!cancelled) setStations(data); })
      .catch((e) => { if (!cancelled) setError(e.message || "Unable to load polling stations."); });
    return () => { cancelled = true; };
  }, [constituencyId]);

  const selectedRegion = useMemo(() => regions.find((item) => String(item._id) === String(regionId)), [regions, regionId]);
  const selectedConstituency = useMemo(() => constituencies.find((item) => String(item._id) === String(constituencyId)), [constituencies, constituencyId]);
  const selectedStation = useMemo(() => stations.find((item) => String(item._id) === String(stationId)), [stations, stationId]);

  const loadForecast = async (candidate) => {
    if (!candidate?.latitude || !candidate?.longitude) {
      setError("This location could not be mapped to coordinates. Try the town search or select a broader geography.");
      return;
    }
    setWeatherLoading(true);
    setError("");
    try {
      const response = await fetch(weatherUrl(candidate.latitude, candidate.longitude), { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error("The live weather service could not be reached.");
      const data = await response.json();
      if (!data?.current) throw new Error("Weather data is incomplete for this location.");
      setLocation(candidate);
      setWeather(data);
    } catch (e) {
      setError(e.message || "Weather information is currently unavailable.");
    } finally {
      setWeatherLoading(false);
    }
  };

  const resolveSelected = async () => {
    const queryParts = [selectedStation?.name, selectedConstituency?.name, selectedRegion?.name, "Ghana"].filter(Boolean);
    if (!queryParts.length) return;
    const result = await geocode(queryParts.join(", "));
    if (!result) {
      const broader = [selectedConstituency?.name, selectedRegion?.name, "Ghana"].filter(Boolean).join(", ");
      const fallback = await geocode(broader);
      if (!fallback) return setError("No map coordinates were found for this selection.");
      return loadForecast({ ...fallback, label: selectedStation ? `${selectedStation.name}, ${selectedConstituency?.name || selectedRegion?.name || "Ghana"}` : fallback.label });
    }
    return loadForecast({ ...result, label: selectedStation ? `${selectedStation.name}, ${selectedConstituency?.name || selectedRegion?.name || "Ghana"}` : result.label });
  };

  const selectRegion = (value) => {
    setRegionId(value);
    setSearch("");
    setSearchResults([]);
    setWeather(null);
    setLocation(null);
    if (!value) return;
  };

  const selectConstituency = (value) => {
    setConstituencyId(value);
    setSearch("");
    setSearchResults([]);
    setWeather(null);
    setLocation(null);
  };

  const selectStation = (value) => {
    setStationId(value);
    setSearch("");
    setSearchResults([]);
    setWeather(null);
    setLocation(null);
  };

  const runTownSearch = async (event) => {
    event?.preventDefault();
    const query = search.trim();
    if (!query) return;
    setSearchLoading(true);
    setError("");
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error("Town search is temporarily unavailable.");
      const data = await response.json();
      const results = Array.isArray(data?.results) ? data.results : [];
      const ghanaResults = results.filter((item) => !item.country_code || String(item.country_code).toUpperCase() === "GH");
      setSearchResults(ghanaResults.length ? ghanaResults : results);
      if (!results.length) setError(`No weather location found for “${query}”.`);
    } catch (e) {
      setError(e.message || "Unable to search for that town.");
    } finally {
      setSearchLoading(false);
    }
  };

  const chooseSearchResult = (item) => {
    setSearchResults([]);
    setLocation({ latitude: item.latitude, longitude: item.longitude, label: formatGeocoderLabel(item) });
    loadForecast({ latitude: item.latitude, longitude: item.longitude, label: formatGeocoderLabel(item) });
  };

  const current = weather?.current;
  const daily = buildDaily(weather);
  const hourly = buildHourly(weather).slice(0, 8);

  return (
    <section className="weather-explorer" aria-label="Location weather forecast">
      <div className="weather-explorer-heading">
        <div><span>WEATHER & FORECAST</span><h2>Weather for any location</h2><p>Select a Region → Constituency → Polling Station, or search any town.</p></div>
        <div className="weather-icon">☀️</div>
      </div>

      <div className="weather-location-controls">
        <div className="weather-field"><label>Region</label><select value={regionId} onChange={(e) => selectRegion(e.target.value)} disabled={loading}><option value="">Select region</option>{regions.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
        <div className="weather-field"><label>Constituency</label><select value={constituencyId} onChange={(e) => selectConstituency(e.target.value)} disabled={!regionId || constituencies.length === 0}><option value="">Select constituency</option>{constituencies.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
        <div className="weather-field"><label>Polling Station</label><select value={stationId} onChange={(e) => selectStation(e.target.value)} disabled={!constituencyId || stations.length === 0}><option value="">Select polling station</option>{stations.map((item) => <option key={item._id || item.pollingStationCode} value={item._id}>{item.name}{item.pollingStationCode ? ` — ${item.pollingStationCode}` : ""}</option>)}</select></div>
        <button type="button" className="weather-apply" disabled={!regionId || weatherLoading} onClick={resolveSelected}>{weatherLoading ? "Loading…" : "View forecast"}</button>
      </div>

      <div className="weather-divider"><span>OR</span></div>
      <form className="weather-town-search" onSubmit={runTownSearch}>
        <div className="weather-search-input"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search any town, city or locality" aria-label="Search any town, city or locality" /><button type="submit" disabled={searchLoading || !search.trim()}>{searchLoading ? "Searching…" : "Search"}</button></div>
      </form>

      {searchResults.length > 0 && <div className="weather-search-results">{searchResults.map((item, index) => <button type="button" key={`${item.latitude}-${item.longitude}-${index}`} onClick={() => chooseSearchResult(item)}><strong>{item.name}</strong><span>{formatGeocoderLabel(item)}</span></button>)}</div>}
      {error && <div className="weather-error" role="alert">{error}</div>}

      {weather && current ? <div className="weather-results">
        <div className="weather-selected"><span>FORECAST LOCATION</span><strong>{location?.label || "Selected location"}</strong><small>{location?.latitude?.toFixed?.(4)}, {location?.longitude?.toFixed?.(4)}</small></div>
        <div className="weather-current"><div><small>CURRENT CONDITIONS</small><strong>{formatNumber(current.temperature_2m)}°C</strong><span>{weatherCodeToText(current.weather_code)} · Feels like {formatNumber(current.apparent_temperature)}°C</span></div><div className="weather-current-icon">{getWeatherIcon(current.weather_code)}</div></div>
        <div className="weather-metrics"><Metric label="Humidity" value={`${formatNumber(current.relative_humidity_2m)}%`} /><Metric label="Wind" value={`${formatNumber(current.wind_speed_10m)} km/h`} /><Metric label="Rain chance" value={`${formatNumber(weather?.daily?.precipitation_probability_max?.[0])}%`} /></div>
        {hourly.length > 0 && <div className="weather-forecast-section"><div className="weather-section-title"><strong>Next hours</strong><span>Local time</span></div><div className="weather-hourly">{hourly.map((item) => <div key={item.time}><span>{formatHour(item.time)}</span><b>{getWeatherIcon(item.weatherCode)}</b><strong>{formatNumber(item.temperature)}°</strong><small>💧 {item.precipitationProbability ?? "--"}%</small></div>)}</div></div>}
        {daily.length > 0 && <div className="weather-forecast-section"><div className="weather-section-title"><strong>7-day forecast</strong><span>Updated from live forecast data</span></div><div className="weather-daily">{daily.map((item) => <div key={item.date}><span>{formatDay(item.date)}</span><b>{getWeatherIcon(item.weatherCode)}</b><strong>{formatNumber(item.max)}° / {formatNumber(item.min)}°</strong><small>{item.precipitationProbability ?? "--"}% rain</small></div>)}</div></div>}
      </div> : <div className="weather-empty"><strong>Select a location to see its forecast.</strong><span>Your device location is no longer required — every user can choose the exact electoral geography or search a town.</span></div>}

      <style jsx>{`
        .weather-explorer{width:100%;box-sizing:border-box;padding:20px;border:1px solid #e1e9e3;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(17,65,36,.05);min-width:0}.weather-explorer-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.weather-explorer-heading span,.weather-selected span,.weather-current small{display:block;color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.2px}.weather-explorer-heading h2{margin:4px 0;color:#075f2b;font-size:18px;font-weight:850}.weather-explorer-heading p{margin:0;color:#77837c;font-size:10px;line-height:1.45}.weather-icon{width:44px;height:44px;display:grid;place-items:center;border-radius:13px;background:#f4f8f5;font-size:24px;flex:0 0 auto}
        .weather-location-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr)) auto;gap:8px;margin-top:18px;align-items:end}.weather-field{min-width:0}.weather-field label{display:block;margin-bottom:5px;color:#68756d;font-size:9px;font-weight:800}.weather-field select{width:100%;min-width:0;box-sizing:border-box;padding:11px;border:1px solid #d8e3db;border-radius:10px;background:#fbfdfb;color:#29362f;font-size:10px}.weather-field select:disabled{opacity:.55}.weather-apply{min-height:38px;padding:0 13px;border:0;border-radius:10px;background:#075f2b;color:#fff;font-size:10px;font-weight:850;cursor:pointer;white-space:nowrap}.weather-apply:disabled{opacity:.55;cursor:not-allowed}
        .weather-divider{display:flex;align-items:center;gap:8px;margin:14px 0;color:#a0aaa4;font-size:8px;font-weight:800}.weather-divider:before,.weather-divider:after{content:"";height:1px;flex:1;background:#edf1ee}.weather-town-search{margin:0}.weather-search-input{display:flex;align-items:center;gap:7px;padding:3px 4px 3px 11px;border:1px solid #d8e3db;border-radius:11px;background:#fbfdfb}.weather-search-input>span{color:#7e8b83;font-size:18px}.weather-search-input input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#27352d;font-size:10px}.weather-search-input button{min-height:32px;padding:0 12px;border:0;border-radius:8px;background:#eaf5ee;color:#075f2b;font-size:9px;font-weight:850;cursor:pointer}.weather-search-input button:disabled{opacity:.5;cursor:not-allowed}.weather-search-results{display:grid;gap:5px;margin-top:8px;padding:5px;border:1px solid #e3ebe5;border-radius:11px;background:#fff;max-height:190px;overflow:auto}.weather-search-results button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:8px 10px;border:0;border-radius:8px;background:#f8fbf9;text-align:left;cursor:pointer}.weather-search-results button:hover{background:#edf6f0}.weather-search-results strong{color:#2a372f;font-size:10px}.weather-search-results span{color:#7f8b84;font-size:8px}.weather-error{margin-top:10px;padding:10px;border:1px solid #efcaca;border-radius:10px;background:#fff6f6;color:#a11d1d;font-size:9px;overflow-wrap:anywhere}.weather-results{margin-top:14px}.weather-selected{display:flex;flex-direction:column;gap:3px;padding:11px 12px;border-radius:11px;background:#f5faf6;border:1px solid #dce9df}.weather-selected strong{color:#26342c;font-size:12px;overflow-wrap:anywhere}.weather-selected small{color:#8b958f;font-size:8px}.weather-current{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:10px;padding:15px;border-radius:13px;background:linear-gradient(135deg,#eff8f1,#fff)}.weather-current strong{display:block;margin-top:4px;color:#075f2b;font-size:36px;line-height:1;font-weight:850}.weather-current span{display:block;margin-top:5px;color:#66736b;font-size:9px}.weather-current-icon{font-size:34px}.weather-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:8px}.weather-metric{padding:10px;border:1px solid #e4ebe6;border-radius:10px;background:#fff}.weather-metric span{display:block;color:#8a948e;font-size:8px}.weather-metric strong{display:block;margin-top:3px;color:#27352d;font-size:11px}.weather-forecast-section{margin-top:13px;padding-top:12px;border-top:1px solid #edf1ee}.weather-section-title{display:flex;justify-content:space-between;gap:8px;margin-bottom:8px}.weather-section-title strong{color:#29362f;font-size:10px}.weather-section-title span{color:#9aa39e;font-size:7px}.weather-hourly{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px}.weather-hourly>div{min-width:0;padding:7px 3px;border:1px solid #e7eee9;border-radius:8px;background:#f9fbfa;text-align:center}.weather-hourly span,.weather-hourly small{display:block;color:#8b958f;font-size:6px}.weather-hourly b{display:block;margin:3px 0;font-size:13px}.weather-hourly strong{display:block;color:#075f2b;font-size:9px}.weather-daily{display:grid;gap:5px}.weather-daily>div{display:grid;grid-template-columns:55px 24px minmax(0,1fr) auto;align-items:center;gap:7px;padding:8px 9px;border:1px solid #e7eee9;border-radius:9px;background:#fbfdfb}.weather-daily span{color:#2d3932;font-size:8px;font-weight:800}.weather-daily b{text-align:center;font-size:14px}.weather-daily strong{color:#075f2b;font-size:8px}.weather-daily small{color:#7e8982;font-size:7px;text-align:right}.weather-empty{margin-top:13px;padding:16px;border:1px dashed #d7e2da;border-radius:12px;background:#fbfdfb;text-align:center}.weather-empty strong{display:block;color:#2d3932;font-size:11px}.weather-empty span{display:block;margin-top:4px;color:#8a948e;font-size:8px;line-height:1.45}
        @media(max-width:760px){.weather-location-controls{grid-template-columns:1fr}.weather-apply{width:100%}.weather-hourly{grid-template-columns:repeat(4,minmax(0,1fr))}.weather-daily>div{grid-template-columns:48px 22px minmax(0,1fr);}.weather-daily small{display:none}}
        @media(max-width:420px){.weather-explorer{padding:15px}.weather-metrics{grid-template-columns:1fr}.weather-current strong{font-size:31px}}
      `}</style>
    </section>
  );
}

async function geocode(query) {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const ghana = results.find((item) => String(item.country_code || "").toUpperCase() === "GH");
    const item = ghana || results[0];
    return item ? { latitude: item.latitude, longitude: item.longitude, label: formatGeocoderLabel(item) } : null;
  } catch {
    return null;
  }
}

function formatGeocoderLabel(item) {
  return [item?.name, item?.admin2, item?.admin1, item?.country].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index).join(", ");
}

function buildHourly(data) {
  const time = data?.hourly?.time || [];
  return time.map((value, index) => ({ time: value, temperature: numberOrNull(data.hourly.temperature_2m?.[index]), precipitationProbability: numberOrNull(data.hourly.precipitation_probability?.[index]), weatherCode: data.hourly.weather_code?.[index] ?? null }));
}

function buildDaily(data) {
  const dates = data?.daily?.time || [];
  return dates.map((date, index) => ({ date, max: numberOrNull(data.daily.temperature_2m_max?.[index]), min: numberOrNull(data.daily.temperature_2m_min?.[index]), precipitationProbability: numberOrNull(data.daily.precipitation_probability_max?.[index]), weatherCode: data.daily.weather_code?.[index] ?? null }));
}

function numberOrNull(value) { const number = Number(value); return Number.isFinite(number) ? number : null; }
function formatNumber(value) { const number = numberOrNull(value); return number === null ? "--" : Math.round(number); }
function formatHour(value) { try { return new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(new Date(value)); } catch { return String(value).slice(11, 16); } }
function formatDay(value) { try { return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(`${value}T12:00:00`)); } catch { return value; } }
function getWeatherIcon(code) { const c = Number(code); if (c === 0) return "☀️"; if ([1,2].includes(c)) return "🌤️"; if (c === 3) return "☁️"; if ([45,48].includes(c)) return "🌫️"; if ([51,53,55,56,57].includes(c)) return "🌦️"; if ([61,63,65,66,67,80,81,82].includes(c)) return "🌧️"; if ([71,73,75,77,85,86].includes(c)) return "🌨️"; if ([95,96,99].includes(c)) return "⛈️"; return "🌡️"; }
function weatherCodeToText(code) { const c = Number(code); const map = { 0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Depositing rime fog",51:"Light drizzle",53:"Moderate drizzle",55:"Dense drizzle",56:"Light freezing drizzle",57:"Dense freezing drizzle",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",66:"Light freezing rain",67:"Heavy freezing rain",71:"Slight snow",73:"Moderate snow",75:"Heavy snow",77:"Snow grains",80:"Slight rain showers",81:"Moderate rain showers",82:"Violent rain showers",85:"Slight snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with slight hail",99:"Thunderstorm with heavy hail" }; return map[c] || "Current conditions"; }
function Metric({ label, value }) { return <div className="weather-metric"><span>{label}</span><strong>{value}</strong></div>; }
