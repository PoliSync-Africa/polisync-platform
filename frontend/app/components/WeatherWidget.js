"use client";

import { useEffect, useState } from "react";

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    async function loadWeather() {
      try {
        // Techiman, Ghana
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=7.59&longitude=-1.94&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto"
        );

        const data = await res.json();
        setWeather(data.current);
      } catch (err) {
        console.error(err);
      }
    }

    loadWeather();
  }, []);

  return (
    <div
      style={{
        width: "320px",
        background: "#14213D",
        color: "white",
        padding: "24px",
        borderRadius: "20px",
        boxShadow: "0 15px 35px rgba(0,0,0,0.25)"
      }}
    >
      <h3 style={{ marginBottom: "10px" }}>
        🌤 Weather Intelligence
      </h3>

      <p style={{ color: "#BFD7EA" }}>
        Techiman, Bono East
      </p>

      {weather ? (
        <>
          <h1 style={{ fontSize: "52px", margin: "18px 0" }}>
            {Math.round(weather.temperature_2m)}°C
          </h1>

          <p>Humidity: {weather.relative_humidity_2m}%</p>
          <p>Wind: {weather.wind_speed_10m} km/h</p>

          <caption>
            Updated: {weather.time.replace("T", " ")}
          </caption>
        </>
      ) : (
        <p>Loading weather...</p>
      )}
    </div>
  );
