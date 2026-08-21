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
const organizationRoutes = require("./routes/organization");
const electionRoutes = require("./routes/elections");
const pollingStationRoutes = require("./routes/pollingStations");
const resultRoutes = require("./routes/results");

/* Optional routes */

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
    version: "1.0.0"
  });
});

/* ============================
   API Routes
============================ */

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/polling-stations", pollingStationRoutes);
app.use("/api/results", resultRoutes);

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
