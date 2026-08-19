const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const resultsRoutes = require("./routes/results");
const electionsRoutes = require("./routes/elections");
const organizationRoutes = require("./routes/organizations");
const organizationUnitRoutes = require("./routes/organizationUnits");
const adminRoutes = require("./routes/admin");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "POLISYNC AFRICA API",
    version: "1.0.0",
    status: "Running"
  });
});

app.use("/auth", authRoutes);
app.use("/health", healthRoutes);
app.use("/results", resultsRoutes);
app.use("/elections", electionsRoutes);
app.use("/organizations", organizationRoutes);
app.use("/organization-units", organizationUnitRoutes);
app.use("/admin", adminRoutes);

module.exports = app;
