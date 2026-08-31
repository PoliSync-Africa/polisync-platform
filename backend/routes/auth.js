const express = require("express");

const {
  register,
  forgotPassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification,
  verifyPasswordReset,
  resetPassword,
  changePassword,
  me,
  logout,
  verifyLoginOTP,
  resendLoginOTP,
} = require("../controllers/authController");

const smsLogin = require("../controllers/smsLoginController");

const router = express.Router();

// ============================================================
// POLISYNC AFRICA — AUTHENTICATION ROUTES
// ============================================================
//
// Authentication is SMS-first:
// - Email remains the account identifier.
// - Password remains the first credential.
// - Arkesel SMS OTP is the verification/security challenge.
// - Email verification is NOT required for login.
// ============================================================

router.use(express.urlencoded({ extended: false }));

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "PoliSync Africa Authentication API is running.",
  });
});

router.post("/register", register);

// Every account — including Super Admin — uses the same SMS-first login.
router.post("/login", smsLogin);

// Legacy email verification endpoints remain available for account data
// compatibility, but they are no longer required for login access.
router.post("/verify-email", verifyEmail);
router.post("/verify-phone", verifyPhone);
router.post("/resend-email-verification", resendEmailVerification);
router.post("/resend-phone-verification", resendPhoneVerification);

router.post("/verify-login-otp", verifyLoginOTP);
router.post("/resend-login-otp", resendLoginOTP);

router.post("/forgot-password", forgotPassword);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.get("/me", me);
router.post("/logout", logout);

module.exports = router;
