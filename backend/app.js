const express = require("express");
const cors = require("cors");

const app = express();

/* ============================
   Middleware
============================ */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ============================
   Route Imports
============================ */

const authRoutes = require("./routes/auth");

/* Optional routes - to be implemented in Phase 2+ */

let organizationRoutes;
try {
  organizationRoutes = require("./routes/organization");
} catch {}

let electionRoutes;
try {
  electionRoutes = require("./routes/elections");
} catch {}

let pollingStationRoutes;
try {
  pollingStationRoutes = require("./routes/pollingStations");
} catch {}

let resultRoutes;
try {
  resultRoutes = require("./routes/results");
} catch {}

let calendarRoutes;
try {
  calendarRoutes = require("./routes/calendar");
} catch {}

let notificationRoutes;
try {
  notificationRoutes = require("./routes/notifications");
} catch {}

let geoRoutes;
try {
  geoRoutes = require("./routes/geoRoutes");
} catch {}

let gisRoutes;
try {
  gisRoutes = require("./routes/gisRoutes");
} catch {}

/* ============================
   Health Check
============================ */

app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "POLISYNC AFRICA Backend",
    status: "running",
    version: "1.0.0",
    database: "MongoDB + Mongoose"
  });
});

/* ============================
   API Routes
============================ */

app.use("/api/auth", authRoutes);

if (organizationRoutes) {
  app.use("/api/organizations", organizationRoutes);
}

if (electionRoutes) {
  app.use("/api/elections", electionRoutes);
}

if (pollingStationRoutes) {
  app.use("/api/polling-stations", pollingStationRoutes);
}

if (resultRoutes) {
  app.use("/api/results", resultRoutes);
}

if (calendarRoutes) {
  app.use("/api/calendar", calendarRoutes);
}

if (notificationRoutes) {
  app.use("/api/notifications", notificationRoutes);
}

if (geoRoutes) {
  app.use("/api/geo", geoRoutes);
}

if (gisRoutes) {
  app.use("/api/gis", gisRoutes);
}

/* ======================
   404 Handler
====================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

/* ============================
   Error Handler
============================ */

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

module.exports = app;
