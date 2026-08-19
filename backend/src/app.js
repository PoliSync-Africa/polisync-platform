const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");

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

module.exports = app;
