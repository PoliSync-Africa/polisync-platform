const express = require("express");

const {
  register,
  me,
  forgotPassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification,
  verifyPasswordReset,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

const secureSessionAuth = require("../controllers/secureSessionAuthController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PoliSync Africa Authentication API is running.",
  });
});

router.post("/register", register);

// All new interactive login sessions are server-side revocable and expire after 24 hours.
router.post("/login", secureSessionAuth.startLogin);
router.post("/verify-login-otp", secureSessionAuth.verifyLogin);
router.post("/resend-login-otp", secureSessionAuth.resendLogin);
router.post("/logout", protect, secureSessionAuth.logout);
router.get("/me", protect, me);

// Legacy email endpoints remain available for compatibility.
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification", resendEmailVerification);

// Arkesel phone verification.
router.post("/verify-phone", verifyPhone);
router.post("/resend-phone-verification", resendPhoneVerification);

router.post("/forgot-password", forgotPassword);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password", protect, changePassword);

module.exports = router;
