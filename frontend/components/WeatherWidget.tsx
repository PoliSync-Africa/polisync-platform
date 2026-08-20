"use client";

import { useEffect, useState } from "react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      try {
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=5.6037&longitude=-0.1870&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m"
        );

        if (!response.ok) {
          throw new Error("Weather request failed");
        }

        const data = await response.json();
        setWeather(data.current);
      } catch (error) {
        console.error("Weather error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          background: "#111827",
          color: "white",
        }}
      >
        Loading weather...
      </div>
    );
  }

  if (!weather) {
    return (
      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          background: "#111827",
          color: "white",
        }}
      >
        Weather unavailable
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "12px",
        background: "#111827",
        color: "white",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>Accra Weather</h3>

      <div style={{ fontSize: "28px", fontWeight: "bold" }}>
        {weather.temperature_2m}°C
      </div>

      <div style={{ marginTop: "8px", opacity: 0.8 }}>
        Humidity: {weather.relative_humidity_2m}%
      </div>

      <div style={{ marginTop: "4px", opacity: 0.8 }}>
        Wind: {weather.wind_speed_10m} km/h
      </div>
    </div>
  );
}
