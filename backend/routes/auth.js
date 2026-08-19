const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Status
router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Authentication routes ready"
  });
});

// Authentication
router.post("/register", register);
router.post("/login", login);

module.exports = router;
