const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

// Status
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Authentication routes ready"
  });
});

// Authentication Routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);

module.exports = router;
