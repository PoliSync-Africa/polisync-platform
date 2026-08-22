const express = require("express");
const {
  register,
  login,
  forgotPassword
} = require("../controllers/authController");

const router = express.Router();

// Status Check
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PoliSync Africa Authentication API Ready"
  });
});

// Authentication
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

module.exports = router;
