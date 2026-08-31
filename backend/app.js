const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "https://polisync-app.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS origin not allowed."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: false,
  })
);

// Profile photos are resized by the frontend before upload.
// Keep a moderate JSON limit for the resulting base64 image payload.
app.use(express.json({ limit: "400kb" }));
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
const phoneOtpRoutes = require("./routes/phoneOtp");
const profileRoutes = require("./routes/profile");
let organizationRoutes;
try { organizationRoutes = require("./routes/organization"); } catch { organizationRoutes = null; }
let partyOrganizationRoutes;
try { partyOrganizationRoutes = require("./routes/partyOrganization"); } catch { partyOrganizationRoutes = null; }
let personalWorkspaceRoutes;
try { personalWorkspaceRoutes = require("./routes/personalWorkspace"); } catch { personalWorkspaceRoutes = null; }
let electoralGeographyRoutes;
try { electoralGeographyRoutes = require("./routes/electoralGeography"); } catch { electoralGeographyRoutes = null; }
let electionRoutes;
try { electionRoutes = require("./routes/elections"); } catch { electionRoutes = null; }
let pollingStationRoutes;
try { pollingStationRoutes = require("./routes/pollingStationRoutes"); } catch { pollingStationRoutes = null; }
let resultRoutes;
try { resultRoutes = require("./routes/results"); } catch { resultRoutes = null; }
let calendarRoutes;
try { calendarRoutes = require("./routes/calendar"); } catch { calendarRoutes = null; }
let notificationRoutes;
try { notificationRoutes = require("./routes/notifications"); } catch { notificationRoutes = null; }
let geoRoutes;
try { geoRoutes = require("./routes/geoRoutes"); } catch { geoRoutes = null; }
let gisRoutes;
try { gisRoutes = require("./routes/gisRoutes"); } catch { gisRoutes = null; }
let setupRoutes;
try { setupRoutes = require("./routes/setup"); } catch { setupRoutes = null; }

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "POLISYNC AFRICA Backend",
    status: "running",
    version: "1.0.0",
    database: "MongoDB + Mongoose",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/phone-otp", phoneOtpRoutes);
app.use("/api/profile", profileRoutes);
if (organizationRoutes) app.use("/api/organizations", organizationRoutes);
if (partyOrganizationRoutes) app.use("/api/party-organizations", partyOrganizationRoutes);
if (personalWorkspaceRoutes) app.use("/api/personal-workspace", personalWorkspaceRoutes);
if (electoralGeographyRoutes) app.use("/api/electoral-geography", electoralGeographyRoutes);
if (electionRoutes) app.use("/api/elections", electionRoutes);
if (pollingStationRoutes) app.use("/api/polling-stations", pollingStationRoutes);
if (resultRoutes) app.use("/api/results", resultRoutes);
if (calendarRoutes) app.use("/api/calendar", calendarRoutes);
if (notificationRoutes) app.use("/api/notifications", notificationRoutes);
if (geoRoutes) app.use("/api/geo", geoRoutes);
if (gisRoutes) app.use("/api/gis", gisRoutes);
if (setupRoutes) app.use("/api/setup", setupRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use((err, req, res, next) => {
  console.error("PoliSync API error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;
