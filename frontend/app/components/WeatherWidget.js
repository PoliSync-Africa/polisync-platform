"use client";

import { useEffect, useState } from "react";

const ghanaLocations = [
  { name: "Accra", region: "Greater Accra", lat: 5.6037, lon: -0.1870 },
  { name: "Kumasi", region: "Ashanti", lat: 6.6885, lon: -1.6244 },
  { name: "Techiman", region: "Bono East", lat: 7.5840, lon: -1.9395 },
  { name: "Sunyani", region: "Bono", lat: 7.3399, lon: -2.3268 },
  { name: "Goaso", region: "Ahafo", lat: 6.8047, lon: -2.5164 },
  { name: "Cape Coast", region: "Central", lat: 5.1053, lon: -1.2466 },
  { name: "Koforidua", region: "Eastern", lat: 6.0941, lon: -0.2591 },
  { name: "Ho", region: "Volta", lat: 6.6111, lon: 0.4713 },
  { name: "Dambai", region: "Oti", lat: 8.0746, lon: 0.1806 },
  { name: "Takoradi", region: "Western", lat: 4.8845, lon: -1.7554 },
  { name: "Sefwi Wiawso", region: "Western North", lat: 6.2060, lon: -2.4860 },
  { name: "Tamale", region: "Northern", lat: 9.4034, lon: -0.8424 },
  { name: "Nalerigu", region: "North East", lat: 10.5270, lon: -0.3690 },
  { name: "Bolgatanga", region: "Upper East", lat: 10.7856, lon: -0.8514 },
  { name: "Wa", region: "Upper West", lat: 10.0601, lon: -2.5019 },
  { name: "Keta", region: "Volta", lat: 5.9179, lon: 0.9879 }
];

export default function WeatherWidget() {
  const [selectedLocation, setSelectedLocation] = useState(
    ghanaLocations.find((l) => l.name === "Techiman")
  );
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWeather() {
      setLoading(true);

      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedLocation.lat}&longitude=${selectedLocation.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=auto`
        );

        const data = await res.json();
        setWeather(data.current);
      } catch (error) {
        console.error("Weather fetch failed:", error);
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
  }, [selectedLocation]);

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(135deg, #0A2540, #134E8C)",
        color: "white",
        borderRadius: "20px",
        padding: "24px",
        marginTop: "24px",
        boxShadow: "0 12px 30px rgba(0,0,0,0.25)"
      }}
    >
      <h3 style={{ marginBottom: "16px" }}>🌤 Weather Intelligence</h3>

      <select
        value={selectedLocation.name}
        onChange={(e) =>
          setSelectedLocation(
            ghanaLocations.find((loc) => loc.name === e.target.value)
          )
        }
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          marginBottom: "18px",
          fontSize: "16px"
        }}
      >
        {ghanaLocations.map((loc) => (
          <option key={loc.name} value={loc.name}>
            {loc.name} — {loc.region}
          </option>
        ))}
      </select>

      <p style={{ color: "#BFD7EA", marginBottom: "12px" }}>
        {selectedLocation.name}, {selectedLocation.region}
      </p>

      {loading ? (
        <p>Loading weather...</p>
      ) : weather ? (
        <>
          <h1 style={{ fontSize: "54px", margin: "10px 0" }}>
            {Math.round(weather.temperature_2m)}°C
          </h1>

          <p>💧 Humidity: {weather.relative_humidity_2m}%</p>
          <p>💨 Wind Speed: {weather.wind_speed_10m} km/h</p>
          <p>🧭 Wind Direction: {weather.wind_direction_10m}°</p>

          <p
            style={{
              marginTop: "16px",
              fontSize: "13px",
              color: "#BFD7EA"
            }}
          >
            Updated: {weather.time.replace("T", " ")}
          </p>
        </>
      ) : (
        <p>Unable to load weather.</p>
      )}
    </div>
  );
}
