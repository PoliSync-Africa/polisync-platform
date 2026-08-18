const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    platform: "POLISYNC AFRICA",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
