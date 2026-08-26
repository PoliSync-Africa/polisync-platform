const express = require("express");

const {
  register,
  login,
  forgotPassword,
} = require("../controllers/authController");

const router = express.Router();

// ============================================================
// FORM DATA SUPPORT
// ============================================================

router.use(express.urlencoded({ extended: false }));

// ============================================================
// AUTH STATUS
// ============================================================

router.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "PoliSync Africa Authentication API is running.",
  });
});

// ============================================================
// AUTHENTICATION
// ============================================================

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
