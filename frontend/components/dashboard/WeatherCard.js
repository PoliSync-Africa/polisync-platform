"use client";

import { useEffect, useState } from "react";

export default function WeatherCard({
  compact = false,
}) {
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    feelsLike: null,
    location: "Detecting location...",
    condition: "Loading weather...",
    humidity: null,
    windSpeed: null,
    updatedAt: null,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        setError("");

        const response = await fetch("/api/weather", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load current weather.");
        }

        const data = await response.json();

        if (cancelled) {
          return;
        }

        setWeather({
          loading: false,

          temperature:
            data?.temperature ??
            data?.current?.temperature ??
            null,

          feelsLike:
            data?.feelsLike ??
            data?.current?.feelsLike ??
            null,

          location:
            data?.location ||
            data?.locationName ||
            data?.city ||
            "Location unavailable",

          condition:
            data?.condition ||
            data?.description ||
            data?.current?.condition ||
            "Current conditions unavailable",

          humidity:
            data?.humidity ??
            data?.current?.humidity ??
            null,

          windSpeed:
            data?.windSpeed ??
            data?.current?.windSpeed ??
            null,

          updatedAt:
            data?.updatedAt ||
            data?.current?.updatedAt ||
            new Date().toISOString(),
        });
      } catch (weatherError) {
        if (cancelled) {
          return;
        }

        console.error(
          "PoliSync weather error:",
          weatherError
        );

        setError(
          weatherError?.message ||
            "Weather information is currently unavailable."
        );

        setWeather((current) => ({
          ...current,
          loading: false,
          location: "Location unavailable",
          condition: "Weather unavailable",
        }));
      }
    }

    loadWeather();

    /*
     * Refresh the weather periodically so dashboards
     * do not remain on stale conditions.
     */
    const interval = setInterval(
      loadWeather,
      10 * 60 * 1000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (compact) {
    return (
      <div className="polisync-weather-compact">
        <div className="weather-compact-icon">
          {getWeatherIcon(weather.condition)}
        </div>

        <div className="weather-compact-content">
          <strong>
            {weather.loading
              ? "--°C"
              : weather.temperature !== null
                ? `${weather.temperature}°C`
                : "--°C"}
          </strong>

          <span>
            {weather.location}
          </span>
        </div>

        <style jsx>{`
          .polisync-weather-compact {
            display: flex;
            align-items: center;
            gap: 9px;
          }

          .weather-compact-icon {
            font-size: 21px;
            line-height: 1;
          }

          .weather-compact-content {
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .weather-compact-content strong {
            color: #075f2b;
            font-size: 13px;
            font-weight: 850;
            line-height: 1.2;
          }

          .weather-compact-content span {
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #7d867f;
            font-size: 9px;
            line-height: 1.3;
          }
        `}</style>
      </div>
    );
  }

  return (
    <section className="polisync-weather-card">
      {/* ====================================================
          CARD HEADER
      ==================================================== */}

      <div className="weather-card-header">
        <div>
          <span className="weather-card-label">
            LIVE WEATHER
          </span>

          <h2>Current Conditions</h2>
        </div>

        <div className="weather-card-main-icon">
          {getWeatherIcon(weather.condition)}
        </div>
      </div>

      {/* ====================================================
          LOCATION
      ==================================================== */}

      <div className="weather-location">
        <span className="weather-location-icon">
          📍
        </span>

        <div>
          <strong>{weather.location}</strong>

          <span>
            Current available location
          </span>
        </div>
      </div>

      {/* ====================================================
          TEMPERATURE
      ==================================================== */}

      <div className="weather-temperature">
        <span className="weather-temperature-value">
          {weather.loading
            ? "--"
            : weather.temperature !== null
              ? weather.temperature
              : "--"}
        </span>

        <span className="weather-temperature-unit">
          °C
        </span>
      </div>

      <div className="weather-condition">
        {weather.condition}
      </div>

      {/* ====================================================
          DETAILS
      ==================================================== */}

      <div className="weather-details">
        <WeatherDetail
          icon="🌡️"
          label="Feels like"
          value={
            weather.feelsLike !== null
              ? `${weather.feelsLike}°C`
              : "--"
          }
        />

        <WeatherDetail
          icon="💧"
          label="Humidity"
          value={
            weather.humidity !== null
              ? `${weather.humidity}%`
              : "--"
          }
        />

        <WeatherDetail
          icon="💨"
          label="Wind"
          value={
            weather.windSpeed !== null
              ? `${weather.windSpeed}`
              : "--"
          }
        />
      </div>

      {/* ====================================================
          STATUS
      ==================================================== */}

      <div className="weather-footer">
        <span
          className={
            error
              ? "weather-status-error"
              : "weather-status-live"
          }
        >
          <span className="weather-status-dot" />

          {error
            ? "Weather temporarily unavailable"
            : "Live weather"}
        </span>

        <span className="weather-updated">
          {formatUpdatedTime(weather.updatedAt)}
        </span>
      </div>

      <style jsx>{`
        .polisync-weather-card {
          width: 100%;
          padding: 22px;
          border: 1px solid #e3ebe5;
          border-radius: 18px;
          background: #ffffff;
          box-shadow:
            0 8px 24px rgba(17, 65, 36, 0.05);
        }

        .weather-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .weather-card-label {
          display: block;
          color: #c9a227;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.2px;
        }

        .weather-card-header h2 {
          margin: 4px 0 0;
          color: #075f2b;
          font-size: 17px;
          font-weight: 850;
        }

        .weather-card-main-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #f1f7f3;
          font-size: 27px;
        }

        .weather-location {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          padding: 11px 12px;
          border-radius: 12px;
          background: #f7faf8;
        }

        .weather-location-icon {
          font-size: 17px;
        }

        .weather-location div {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .weather-location strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #26332b;
          font-size: 12px;
          font-weight: 800;
        }

        .weather-location span {
          margin-top: 2px;
          color: #8a938d;
          font-size: 9px;
        }

        .weather-temperature {
          display: flex;
          align-items: flex-start;
          margin-top: 20px;
        }

        .weather-temperature-value {
          color: #075f2b;
          font-size: 48px;
          line-height: 0.95;
          font-weight: 850;
          letter-spacing: -2px;
        }

        .weather-temperature-unit {
          margin: 3px 0 0 3px;
          color: #075f2b;
          font-size: 18px;
          font-weight: 800;
        }

        .weather-condition {
          margin-top: 8px;
          color: #606b64;
          font-size: 13px;
          font-weight: 650;
        }

        .weather-details {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-top: 20px;
        }

        .weather-detail {
          min-width: 0;
          padding: 10px;
          border: 1px solid #e8eee9;
          border-radius: 11px;
          background: #ffffff;
        }

        .weather-detail-icon {
          font-size: 14px;
        }

        .weather-detail-label {
          display: block;
          margin-top: 5px;
          color: #8a938d;
          font-size: 8px;
        }

        .weather-detail-value {
          display: block;
          margin-top: 2px;
          color: #26332b;
          font-size: 11px;
          font-weight: 800;
        }

        .weather-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 18px;
          padding-top: 13px;
          border-top: 1px solid #edf1ee;
        }

        .weather-status-live,
        .weather-status-error {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #647069;
          font-size: 9px;
          font-weight: 700;
        }

        .weather-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0a8f3c;
        }

        .weather-status-error .weather-status-dot {
          background: #c9a227;
        }

        .weather-updated {
          color: #9aa29d;
          font-size: 8px;
        }

        @media (max-width: 600px) {
          .polisync-weather-card {
            padding: 18px;
          }

          .weather-temperature-value {
            font-size: 42px;
          }

          .weather-details {
            gap: 6px;
          }

          .weather-detail {
            padding: 8px;
          }
        }
      `}</style>
    </section>
  );
}

/* ============================================================
   WEATHER DETAIL
============================================================ */

function WeatherDetail({
  icon,
  label,
  value,
}) {
  return (
    <div className="weather-detail">
      <span className="weather-detail-icon">
        {icon}
      </span>

      <span className="weather-detail-label">
        {label}
      </span>

      <span className="weather-detail-value">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   WEATHER ICON
============================================================ */

function getWeatherIcon(condition) {
  const value = String(condition || "").toLowerCase();

  if (
    value.includes("thunder") ||
    value.includes("storm")
  ) {
    return "⛈️";
  }

  if (
    value.includes("rain") ||
    value.includes("shower") ||
    value.includes("drizzle")
  ) {
    return "🌧️";
  }

  if (
    value.includes("cloud") ||
    value.includes("overcast")
  ) {
    return "☁️";
  }

  if (
    value.includes("snow") ||
    value.includes("ice")
  ) {
    return "❄️";
  }

  if (
    value.includes("clear") ||
    value.includes("sun")
  ) {
    return "☀️";
  }

  if (
    value.includes("fog") ||
    value.includes("mist")
  ) {
    return "🌫️";
  }

  return "🌤️";
}

/* ============================================================
   UPDATED TIME
============================================================ */

function formatUpdatedTime(value) {
  if (!value) {
    return "Not updated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return `Updated ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
