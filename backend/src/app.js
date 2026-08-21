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
const electionRoutes = require("./routes/election");
const pollingStationRoutes = require("./routes/pollingStation");
const resultRoutes = require("./routes/result");
const calendarRoutes = require("./routes/calendar");
const notificationRoutes = require("./routes/notifications");

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
app.use("/api/calendar", calendarRoutes);
app.use("/api/notifications", notificationRoutes);

/* ============================
   404 Handler
============================ */

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
