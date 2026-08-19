const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const resultsRoutes = require("./routes/results");
const electionsRoutes = require("./routes/elections");
const organizationRoutes = require("./routes/organizations");
const adminRoutes = require("./routes/admin");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Root API
app.get("/", (req, res) => {
  res.json({
    name: "POLISYNC AFRICA API",
    version: "1.0.0",
    status: "Running"
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/health", healthRoutes);
app.use("/results", resultsRoutes);
app.use("/elections", electionsRoutes);
app.use("/organizations", organizationRoutes);
app.use("/admin", adminRoutes);

module.exports = app;
