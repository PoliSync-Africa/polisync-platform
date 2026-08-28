"use client";

import { useEffect, useState } from "react";

export default function DashboardHeader({
  title = "Dashboard",
  subtitle = "",
  role = "user",
  user = null,
  onMenuClick,
  onNotificationsClick,
  onMessagesClick,
  onProfileClick,
}) {
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    location: "Location unavailable",
    condition: "Weather unavailable",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      try {
        /*
         * Weather/location integration will use the platform's
         * approved location service when connected.
         *
         * This component deliberately does not expose or store
         * precise GPS coordinates in the UI.
         */

        const response = await fetch("/api/weather", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Weather request failed.");
        }

        const data = await response.json();

        if (cancelled) return;

        setWeather({
          loading: false,
          temperature:
            data?.temperature !== undefined
              ? data.temperature
              : null,
          location:
            data?.location ||
            data?.locationName ||
            "Location unavailable",
          condition:
            data?.condition ||
            data?.description ||
            "Current conditions unavailable",
        });
      } catch (error) {
        if (cancelled) return;

        setWeather({
          loading: false,
          temperature: null,
          location: "Location unavailable",
          condition: "Weather unavailable",
        });
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName =
    user?.displayName ||
    user?.fullName ||
    user?.name ||
    "PoliSync User";

  const initials = getInitials(displayName);

  return (
    <header className="polisync-dashboard-header">
      {/* ======================================================
          LEFT SIDE
      ====================================================== */}

      <div className="dashboard-header-left">
        <button
          type="button"
          className="dashboard-mobile-menu"
          aria-label="Open navigation"
          onClick={onMenuClick}
        >
          ☰
        </button>

        <div className="dashboard-page-heading">
          <h1>{title}</h1>

          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="dashboard-header-right">
        {/* ====================================================
            WEATHER
        ==================================================== */}

        <div
          className="dashboard-weather-widget"
          title="Current weather and available location"
        >
          <div className="dashboard-weather-symbol">
            {getWeatherIcon(weather.condition)}
          </div>

          <div className="dashboard-weather-information">
            <strong>
              {weather.loading
                ? "--°C"
                : weather.temperature !== null
                  ? `${weather.temperature}°C`
                  : "--°C"}
            </strong>

            <span>{weather.location}</span>
          </div>
        </div>

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        <button
          type="button"
          className="dashboard-header-icon-button"
          aria-label="Notifications"
          onClick={onNotificationsClick}
        >
          <span aria-hidden="true">🔔</span>

          <span className="dashboard-notification-badge">
            3
          </span>
        </button>

        {/* ====================================================
            MESSAGES
        ==================================================== */}

        <button
          type="button"
          className="dashboard-header-icon-button"
          aria-label="Messages"
          onClick={onMessagesClick}
        >
          <span aria-hidden="true">💬</span>
        </button>

        {/* ====================================================
            PROFILE
        ==================================================== */}

        <button
          type="button"
          className="dashboard-user-button"
          aria-label="Open profile"
          onClick={onProfileClick}
        >
          <span className="dashboard-user-avatar">
            {initials}
          </span>

          <span className="dashboard-user-details">
            <strong>{displayName}</strong>

            <small>{formatRole(role)}</small>
          </span>

          <span className="dashboard-user-arrow">
            ▾
          </span>
        </button>
      </div>

      <style jsx>{`
        .polisync-dashboard-header {
          width: 100%;
          min-height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 28px;
          background: #ffffff;
          border-bottom: 1px solid #e7ece8;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .dashboard-header-left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dashboard-page-heading {
          min-width: 0;
        }

        .dashboard-page-heading h1 {
          margin: 0;
          color: #075f2b;
          font-size: 23px;
          line-height: 1.2;
          font-weight: 850;
        }

        .dashboard-page-heading p {
          margin: 5px 0 0;
          color: #7a837d;
          font-size: 12px;
          line-height: 1.4;
        }

        .dashboard-header-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          flex-shrink: 0;
        }

        /* ====================================================
           WEATHER
        ==================================================== */

        .dashboard-weather-widget {
          min-width: 180px;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 7px 11px;
          border: 1px solid #e5ebe7;
          border-radius: 12px;
          background: #fbfdfb;
        }

        .dashboard-weather-symbol {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          flex-shrink: 0;
        }

        .dashboard-weather-information {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .dashboard-weather-information strong {
          color: #075f2b;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 850;
        }

        .dashboard-weather-information span {
          margin-top: 2px;
          max-width: 125px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #7c857f;
          font-size: 9px;
          line-height: 1.2;
        }

        /* ====================================================
           HEADER BUTTONS
        ==================================================== */

        .dashboard-header-icon-button {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid #e5ebe7;
          border-radius: 10px;
          background: #ffffff;
          cursor: pointer;
          font-size: 17px;
          transition:
            background 0.15s ease,
            transform 0.15s ease;
        }

        .dashboard-header-icon-button:hover {
          background: #f2f7f4;
          transform: translateY(-1px);
        }

        .dashboard-notification-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          min-width: 15px;
          height: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 3px;
          border-radius: 999px;
          background: #c9a227;
          color: #ffffff;
          font-size: 8px;
          font-weight: 900;
          line-height: 1;
          border: 1px solid #ffffff;
        }

        /* ====================================================
           USER
        ==================================================== */

        .dashboard-user-button {
          min-height: 46px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 9px 4px 5px;
          border: 1px solid #e5ebe7;
          border-radius: 12px;
          background: #ffffff;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease;
        }

        .dashboard-user-button:hover {
          background: #f8fbf9;
          border-color: #d7e2db;
        }

        .dashboard-user-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #075f2b;
          color: #ffffff;
          border: 2px solid #c9a227;
          font-size: 12px;
          font-weight: 900;
        }

        .dashboard-user-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 70px;
          max-width: 145px;
        }

        .dashboard-user-details strong {
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #27322c;
          font-size: 11px;
          font-weight: 800;
        }

        .dashboard-user-details small {
          margin-top: 2px;
          color: #858e88;
          font-size: 9px;
          white-space: nowrap;
        }

        .dashboard-user-arrow {
          color: #78827c;
          font-size: 13px;
        }

        /* ====================================================
           MOBILE MENU
        ==================================================== */

        .dashboard-mobile-menu {
          display: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid #e5ebe7;
          border-radius: 10px;
          background: #ffffff;
          color: #075f2b;
          font-size: 20px;
          cursor: pointer;
        }

        /* ====================================================
           TABLET
        ==================================================== */

        @media (max-width: 1100px) {
          .polisync-dashboard-header {
            padding: 13px 20px;
          }

          .dashboard-weather-widget {
            min-width: auto;
          }

          .dashboard-weather-information span {
            max-width: 85px;
          }

          .dashboard-user-details {
            display: none;
          }

          .dashboard-user-button {
            padding-right: 5px;
          }

          .dashboard-user-arrow {
            display: none;
          }
        }

        /* ====================================================
           MOBILE
        ==================================================== */

        @media (max-width: 760px) {
          .polisync-dashboard-header {
            min-height: 70px;
            padding: 10px 13px;
            gap: 8px;
          }

          .dashboard-mobile-menu {
            display: flex;
            flex-shrink: 0;
          }

          .dashboard-page-heading h1 {
            font-size: 18px;
          }

          .dashboard-page-heading p {
            display: none;
          }

          .dashboard-header-right {
            gap: 5px;
          }

          .dashboard-weather-widget {
            display: none;
          }

          .dashboard-header-icon-button {
            width: 36px;
            height: 36px;
            font-size: 15px;
          }

          .dashboard-user-button {
            min-height: 36px;
            padding: 2px;
            border: 0;
          }

          .dashboard-user-avatar {
            width: 34px;
            height: 34px;
          }
        }

        @media (max-width: 390px) {
          .dashboard-page-heading h1 {
            font-size: 16px;
          }

          .dashboard-header-icon-button {
            width: 34px;
            height: 34px;
          }

          .dashboard-user-avatar {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </header>
  );
}

/* ============================================================
   HELPERS
============================================================ */

function getInitials(name) {
  const value = String(name || "").trim();

  if (!value) {
    return "P";
  }

  const parts = value.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return String(role)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getWeatherIcon(condition) {
  const value = String(condition || "").toLowerCase();

  if (
    value.includes("rain") ||
    value.includes("storm") ||
    value.includes("shower")
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
    value.includes("clear") ||
    value.includes("sun")
  ) {
    return "☀️";
  }

  if (value.includes("snow")) {
    return "❄️";
  }

  return "🌤️";
}
