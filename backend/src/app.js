const express = require("express");
const cors = require("cors");
const resultsRoutes = require("./routes/results");
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/const electionsRoutes = require("./routes/elections");
const app = const adminRoutes = require("./routes/admin");
app.use(cors());
app.use(express.json());
app.use("/elections", electionsRoutes);
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
app.use("/admin", adminRoutes);
module.exports = app;
