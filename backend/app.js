const express = require("express");
const cors = require("cors");

const app = express();

// ============================================================
// CORS
// ============================================================
//
// PoliSync frontend:
// https://polisync-app.onrender.com
//
// PoliSync backend:
// https://polysync-platform-1.onrender.com
// ============================================================

const allowedOrigins = [
  "https://polisync-app.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server requests and tools that do not
      // send an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(
          "CORS origin not allowed."
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
    ],

    credentials: false,
  })
);

// ============================================================
// BODY PARSING
// ============================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ============================================================
// ROUTE IMPORTS
// ============================================================

const authRoutes =
  require("./routes/auth");

let organizationRoutes;

try {
  organizationRoutes =
    require(
      "./routes/organization"
    );
} catch {
  organizationRoutes =
    null;
}

let electionRoutes;

try {
  electionRoutes =
    require(
      "./routes/elections"
    );
} catch {
  electionRoutes =
    null;
}

let pollingStationRoutes;

try {
  pollingStationRoutes =
    require(
      "./routes/pollingStations"
    );
} catch {
  pollingStationRoutes =
    null;
}

let resultRoutes;

try {
  resultRoutes =
    require(
      "./routes/results"
    );
} catch {
  resultRoutes =
    null;
}

let calendarRoutes;

try {
  calendarRoutes =
    require(
      "./routes/calendar"
    );
} catch {
  calendarRoutes =
    null;
}

let notificationRoutes;

try {
  notificationRoutes =
    require(
      "./routes/notifications"
    );
} catch {
  notificationRoutes =
    null;
}

let geoRoutes;

try {
  geoRoutes =
    require(
      "./routes/geoRoutes"
    );
} catch {
  geoRoutes =
    null;
}

let gisRoutes;

try {
  gisRoutes =
    require(
      "./routes/gisRoutes"
    );
} catch {
  gisRoutes =
    null;
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      app:
        "POLISYNC AFRICA Backend",
      status:
        "running",
      version:
        "1.0.0",
      database:
        "MongoDB + Mongoose",
    });
  }
);

// ============================================================
// API ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

if (organizationRoutes) {
  app.use(
    "/api/organizations",
    organizationRoutes
  );
}

if (electionRoutes) {
  app.use(
    "/api/elections",
    electionRoutes
  );
}

if (pollingStationRoutes) {
  app.use(
    "/api/polling-stations",
    pollingStationRoutes
  );
}

if (resultRoutes) {
  app.use(
    "/api/results",
    resultRoutes
  );
}

if (calendarRoutes) {
  app.use(
    "/api/calendar",
    calendarRoutes
  );
}

if (notificationRoutes) {
  app.use(
    "/api/notifications",
    notificationRoutes
  );
}

if (geoRoutes) {
  app.use(
    "/api/geo",
    geoRoutes
  );
}

if (gisRoutes) {
  app.use(
    "/api/gis",
    gisRoutes
  );
}

// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message:
        "Route not found.",
    });
  }
);

// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "PoliSync API error:",
      err
    );

    res.status(
      err.status || 500
    ).json({
      success: false,
      message:
        err.message ||
        "Internal Server Error",
    });
  }
);

module.exports = app;
