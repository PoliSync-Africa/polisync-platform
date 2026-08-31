const express = require("express");

const {
  register,
  logout,
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

const smsLogin = require("../controllers/smsLoginController");
const { verifyLoginOTP, resendLoginOTP } = require("../controllers/authController");

const router = express.Router();

// ============================================================
// AUTH STATUS
// ============================================================

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PoliSync Africa Authentication API is running.",
  });
});

router.post("/register", register);

// SMS-FIRST LOGIN — email verification is not required.
router.post("/login", smsLogin);

router.post("/logout", logout);
router.get("/me", me);

// Legacy email endpoints remain available for compatibility,
// but email verification is not a login requirement.
router.post("/verify-email", verifyEmail);
router.post("/resend-email-verification", resendEmailVerification);

// Arkesel phone verification.
router.post("/verify-phone", verifyPhone);
router.post("/resend-phone-verification", resendPhoneVerification);

// Login SMS OTP challenge completion/resend.
router.post("/verify-login-otp", verifyLoginOTP);
router.post("/resend-login-otp", resendLoginOTP);

router.post("/forgot-password", forgotPassword);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);

module.exports = router;
