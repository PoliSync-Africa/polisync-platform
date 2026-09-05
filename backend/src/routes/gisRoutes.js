const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    service: "GIS API",
    status: "working"
  });
});

module.exports = router;
