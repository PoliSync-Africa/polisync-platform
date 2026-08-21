const express = require("express");

const router = express.Router();

// Test endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Notifications API is working",
    notifications: []
  });
});

module.exports = router;
