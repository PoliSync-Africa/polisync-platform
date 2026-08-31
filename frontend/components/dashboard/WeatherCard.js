"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const REFRESH_MS = 10 * 60 * 1000;
const FORECAST_DAYS = 7;

const INITIAL_WEATHER = {
  loading: true,
  location: "Requesting current location...",
  latitude: null,
  longitude: null,
  temperature: null,
  feelsLike: null,
  humidity: null,
  windSpeed: null,
  condition: "Loading live weather...",
  weatherCode: null,
  updatedAt: null,
  hourly: [],
  daily: [],
};

export default function WeatherCard({ compact = false }) {
  const [weather, setWeather] = useState(INITIAL_WEATHER);
  const [error, setError] = useState("");
  const [permissionState, setPermissionState] = useState("prompt");
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("This device does not support location services.");
      setWeather((current) => ({ ...current, loading: false, location: "Location unavailable", condition: "Location services unavailable" }));
      return;
    }

    setRefreshing(true);
    setError("");

    try {
      const position = await getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setPermissionState("granted");

      const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
      weatherUrl.searchParams.set("latitude", String(latitude));
      weatherUrl.searchParams.set("longitude", String(longitude));
      weatherUrl.searchParams.set("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m");
      weatherUrl.searchParams.set("hourly", "temperature_2m,apparent_temperature,precipitation_probability,weather_code");
      weatherUrl.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
      weatherUrl.searchParams.set("forecast_days", String(FORECAST_DAYS));
      weatherUrl.searchParams.set("timezone", "auto");
      weatherUrl.searchParams.set("temperature_unit", "celsius");
      weatherUrl.searchParams.set("wind_speed_unit", "kmh");

      const [weatherResponse, locationName] = await Promise.all([
        fetch(weatherUrl.toString(), { headers: { Accept: "application/json" }, cache: "no-store" }),
        resolveLocationName(latitude, longitude),
      ]);

      if (!weatherResponse.ok) throw new Error("The live weather service could not be reached.");
      const data = await weatherResponse.json();
      if (!data?.current) throw new Error("Live weather data is incomplete.");

      const current = data.current;
      setWeather({
        loading: false,
        // Coordinates are retained internally for weather requests only and are never rendered.
        location: locationName || "Current location",
        latitude,
        longitude,
        temperature: numberOrNull(current.temperature_2m),
        feelsLike: numberOrNull(current.apparent_temperature),
        humidity: numberOrNull(current.relative_humidity_2m),
        windSpeed: numberOrNull(current.wind_speed_10m),
        condition: weatherCodeToText(current.weather_code),
        weatherCode: current.weather_code ?? null,
        updatedAt: current.time || new Date().toISOString(),
        hourly: buildHourlyForecast(data),
        daily: buildDailyForecast(data),
      });
    } catch (weatherError) {
      console.error("PoliSync weather error:", weatherError);
      if (weatherError?.code === 1) setPermissionState("denied");
      setError(weatherError?.message || "Weather information is currently unavailable.");
      setWeather((current) => ({
        ...current,
        loading: false,
        // Never fall back to latitude/longitude.
        location: current.location === "Requesting current location..." ? "Location unavailable" : current.location,
        condition: "Weather unavailable",
      }));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadWeather();
    const interval = window.setInterval(() => mounted && loadWeather(), REFRESH_MS);
    return () => { mounted = false; window.clearInterval(interval); };
  }, [loadWeather]);

  const visibleHourly = useMemo(() => weather.hourly.slice(0, 6), [weather.hourly]);

  if (compact) {
    return (
      <div className="polisync-weather-compact">
        <div className="weather-compact-icon">{getWeatherIcon(weather.weatherCode, weather.condition)}</div>
        <div className="weather-compact-content">
          <strong>{weather.temperature !== null ? `${formatNumber(weather.temperature)}°C` : "--°C"}</strong>
          <span>{weather.location}</span>
        </div>
        <style jsx>{`.polisync-weather-compact{display:flex;align-items:center;gap:9px}.weather-compact-icon{font-size:21px;line-height:1}.weather-compact-content{display:flex;flex-direction:column;min-width:0}.weather-compact-content strong{color:#075f2b;font-size:13px;font-weight:850;line-height:1.2}.weather-compact-content span{max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#7d867f;font-size:9px;line-height:1.3}`}</style>
      </div>
    );
  }

  return (
    <section className="polisync-weather-card" aria-live="polite">
      <div className="weather-card-header">
        <div><span className="weather-card-label">LIVE WEATHER</span><h2>Current Conditions</h2></div>
        <div className="weather-card-main-icon">{getWeatherIcon(weather.weatherCode, weather.condition)}</div>
      </div>

      <div className="weather-location">
        <span className="weather-location-icon">📍</span>
        <div><strong>{weather.location}</strong><span>{weather.latitude !== null ? "Using your current device location" : "Current device location required"}</span></div>
      </div>

      <div className="weather-temperature"><span className="weather-temperature-value">{weather.loading || weather.temperature === null ? "--" : formatNumber(weather.temperature)}</span><span className="weather-temperature-unit">°C</span></div>
      <div className="weather-temperature-label">Atmospheric air temperature at 2 m</div>
      <div className="weather-condition">{weather.condition}</div>

      <div className="weather-details">
        <WeatherDetail icon="🌡️" label="Feels like" value={weather.feelsLike !== null ? `${formatNumber(weather.feelsLike)}°C` : "--"} />
        <WeatherDetail icon="💧" label="Humidity" value={weather.humidity !== null ? `${formatNumber(weather.humidity)}%` : "--"} />
        <WeatherDetail icon="💨" label="Wind" value={weather.windSpeed !== null ? `${formatNumber(weather.windSpeed)} km/h` : "--"} />
      </div>

      {visibleHourly.length > 0 && <div className="forecast-section"><div className="forecast-heading"><strong>Next few hours</strong><span>Live forecast</span></div><div className="hourly-grid">{visibleHourly.map((hour) => <div className="hour-card" key={hour.time}><span className="hour-time">{formatHour(hour.time)}</span><span className="hour-icon">{getWeatherIcon(hour.weatherCode)}</span><strong>{formatNumber(hour.temperature)}°</strong>{hour.precipitationProbability !== null && <span className="hour-rain">💧 {hour.precipitationProbability}%</span>}</div>)}</div></div>}

      {weather.daily.length > 0 && <div className="forecast-section"><div className="forecast-heading"><strong>7-day forecast</strong><span>Location-based</span></div><div className="daily-list">{weather.daily.map((day) => <div className="daily-row" key={day.date}><span className="daily-day">{formatDay(day.date)}</span><span className="daily-icon">{getWeatherIcon(day.weatherCode)}</span><span className="daily-condition">{weatherCodeToText(day.weatherCode)}</span><span className="daily-temp">{formatNumber(day.max)}° / {formatNumber(day.min)}°</span><span className="daily-rain">{day.precipitationProbability !== null ? `${day.precipitationProbability}%` : "--"}</span></div>)}</div></div>}

      {error && <div className="weather-error" role="alert"><strong>{error}</strong>{permissionState === "denied" && <span>Enable location permission for PoliSync in your browser/device settings, then tap refresh.</span>}</div>}

      <div className="weather-footer"><span className={error ? "weather-status-error" : "weather-status-live"}><span className="weather-status-dot" />{refreshing ? "Updating live weather" : "Live weather"}</span><button type="button" className="weather-refresh" onClick={loadWeather} disabled={refreshing}>{refreshing ? "Updating…" : "Refresh"}</button><span className="weather-updated">{formatUpdatedTime(weather.updatedAt)}</span></div>

      <style jsx>{`
        .polisync-weather-card{width:100%;padding:22px;border:1px solid #e3ebe5;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(17,65,36,.05)}
        .weather-card-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.weather-card-label{display:block;color:#c9a227;font-size:9px;font-weight:900;letter-spacing:1.2px}.weather-card-header h2{margin:4px 0 0;color:#075f2b;font-size:17px;font-weight:850}.weather-card-main-icon{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:#f1f7f3;font-size:27px}
        .weather-location{display:flex;align-items:center;gap:9px;margin-top:22px;padding:11px 12px;border-radius:12px;background:#f7faf8}.weather-location-icon{font-size:17px}.weather-location div{min-width:0;display:flex;flex-direction:column}.weather-location strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#26332b;font-size:12px;font-weight:800}.weather-location span{margin-top:2px;color:#8a938d;font-size:9px}
        .weather-temperature{display:flex;align-items:flex-start;margin-top:20px}.weather-temperature-value{color:#075f2b;font-size:48px;line-height:.95;font-weight:850;letter-spacing:-2px}.weather-temperature-unit{margin:3px 0 0 3px;color:#075f2b;font-size:18px;font-weight:800}.weather-temperature-label{margin-top:7px;color:#8a938d;font-size:9px;font-weight:650}.weather-condition{margin-top:7px;color:#606b64;font-size:13px;font-weight:650}
        .weather-details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:20px}.weather-detail{min-width:0;padding:10px;border:1px solid #e8eee9;border-radius:11px;background:#fff}.weather-detail-icon{font-size:14px}.weather-detail-label{display:block;margin-top:5px;color:#8a938d;font-size:8px}.weather-detail-value{display:block;margin-top:2px;color:#26332b;font-size:11px;font-weight:800}
        .forecast-section{margin-top:20px;padding-top:16px;border-top:1px solid #edf1ee}.forecast-heading{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:10px}.forecast-heading strong{color:#26332b;font-size:12px;font-weight:850}.forecast-heading span{color:#9aa29d;font-size:8px}.hourly-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.hour-card{min-width:0;padding:8px 4px;border:1px solid #e8eee9;border-radius:10px;background:#f9fbfa;text-align:center}.hour-time,.hour-rain{display:block;color:#8a938d;font-size:7px}.hour-icon{display:block;margin:4px 0;font-size:15px}.hour-card strong{display:block;color:#075f2b;font-size:10px}.hour-rain{margin-top:3px;font-size:6px}
        .daily-list{display:flex;flex-direction:column;gap:5px}.daily-row{display:grid;grid-template-columns:52px 24px minmax(0,1fr) auto 34px;align-items:center;gap:7px;padding:8px 9px;border:1px solid #edf1ee;border-radius:10px;background:#fff}.daily-day{color:#26332b;font-size:8px;font-weight:800}.daily-icon{font-size:15px;text-align:center}.daily-condition{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#66716a;font-size:8px}.daily-temp{color:#075f2b;font-size:8px;font-weight:800}.daily-rain{color:#718078;font-size:7px;text-align:right}
        .weather-error{display:flex;flex-direction:column;gap:5px;margin-top:16px;padding:11px 12px;border:1px solid #f0c9c9;border-radius:11px;background:#fff6f6;color:#a51d1d;font-size:9px}.weather-error span{color:#7c5d5d}.weather-footer{display:flex;align-items:center;gap:10px;margin-top:18px;padding-top:13px;border-top:1px solid #edf1ee}.weather-status-live,.weather-status-error{display:flex;align-items:center;gap:5px;color:#647069;font-size:9px;font-weight:700}.weather-status-dot{width:6px;height:6px;border-radius:50%;background:#0a8f3c}.weather-status-error .weather-status-dot{background:#c9a227}.weather-refresh{border:0;padding:5px 8px;border-radius:7px;background:#edf6f0;color:#075f2b;font-size:8px;font-weight:800;cursor:pointer}.weather-refresh:disabled{opacity:.6;cursor:wait}.weather-updated{margin-left:auto;color:#9aa29d;font-size:8px;white-space:nowrap}
        @media(max-width:600px){.polisync-weather-card{padding:18px}.weather-temperature-value{font-size:42px}.hourly-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.daily-row{grid-template-columns:48px 22px minmax(0,1fr) auto 30px}.daily-condition{display:none}}
      `}</style>
    </section>
  );
}

function WeatherDetail({ icon, label, value }) { return <div className="weather-detail"><span className="weather-detail-icon">{icon}</span><span className="weather-detail-label">{label}</span><span className="weather-detail-value">{value}</span></div>; }

function getCurrentPosition() { return new Promise((resolve, reject) => { navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000, timeout: 15 * 1000 }); }); }

async function resolveLocationName(latitude, longitude) {
  try {
    // Free client-side reverse geocoding; coordinates never need to be sent to PoliSync's backend.
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("localityLanguage", "en");
    const response = await fetch(url.toString(), { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) return null;
    const data = await response.json();
    const parts = [data?.locality, data?.city, data?.principalSubdivision, data?.countryName].filter(Boolean);
    return parts.filter((value, index, array) => array.indexOf(value) === index).join(", ") || null;
  } catch (error) {
    console.warn("PoliSync reverse geocoding unavailable:", error);
    return null;
  }
}

function buildHourlyForecast(data) {
  const hourly = data?.hourly;
  if (!hourly?.time?.length) return [];
  const now = new Date();
  let startIndex = hourly.time.findIndex((time) => new Date(time) >= now);
  if (startIndex < 0) startIndex = 0;
  return hourly.time.slice(startIndex, startIndex + 6).map((time, index) => {
    const sourceIndex = startIndex + index;
    return { time, temperature: numberOrNull(hourly.temperature_2m?.[sourceIndex]), precipitationProbability: numberOrNull(hourly.precipitation_probability?.[sourceIndex]), weatherCode: hourly.weather_code?.[sourceIndex] ?? null };
  });
}

function buildDailyForecast(data) {
  const daily = data?.daily;
  if (!daily?.time?.length) return [];
  return daily.time.map((date, index) => ({ date, max: numberOrNull(daily.temperature_2m_max?.[index]), min: numberOrNull(daily.temperature_2m_min?.[index]), precipitationProbability: numberOrNull(daily.precipitation_probability_max?.[index]), weatherCode: daily.weather_code?.[index] ?? null }));
}

function numberOrNull(value) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function formatNumber(value) { return value === null || value === undefined || !Number.isFinite(Number(value)) ? "--" : Number(value).toFixed(0); }
function formatHour(value) { if (!value) return "--"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "--" : date.toLocaleTimeString([], { hour: "numeric" }); }
function formatDay(value) { if (!value) return "--"; const date = new Date(`${value}T12:00:00`); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { weekday: "short" }); }
function formatUpdatedTime(value) { if (!value) return "Not updated"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Recently" : `Updated ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`; }

function weatherCodeToText(code) {
  const labels = { 0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Fog",48:"Depositing rime fog",51:"Light drizzle",53:"Moderate drizzle",55:"Dense drizzle",56:"Light freezing drizzle",57:"Dense freezing drizzle",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",66:"Light freezing rain",67:"Heavy freezing rain",71:"Slight snow",73:"Moderate snow",75:"Heavy snow",77:"Snow grains",80:"Slight rain showers",81:"Moderate rain showers",82:"Violent rain showers",85:"Slight snow showers",86:"Heavy snow showers",95:"Thunderstorm",96:"Thunderstorm with slight hail",99:"Thunderstorm with heavy hail" };
  return labels[Number(code)] || "Current conditions";
}

function getWeatherIcon(code, condition = "") {
  const n = Number(code);
  if ([95,96,99].includes(n)) return "⛈️";
  if ([61,63,65,66,67,80,81,82].includes(n)) return "🌧️";
  if ([51,53,55,56,57].includes(n)) return "🌦️";
  if ([71,73,75,77,85,86].includes(n)) return "❄️";
  if ([45,48].includes(n)) return "🌫️";
  if (n === 0) return "☀️";
  if ([1,2].includes(n)) return "🌤️";
  if (n === 3) return "☁️";
  const value = String(condition).toLowerCase();
  if (value.includes("thunder")) return "⛈️";
  if (value.includes("rain")) return "🌧️";
  if (value.includes("cloud")) return "☁️";
  if (value.includes("snow")) return "❄️";
  if (value.includes("fog") || value.includes("mist")) return "🌫️";
  if (value.includes("clear") || value.includes("sun")) return "☀️";
  return "🌤️";
}
