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
const passwordResetRoutes = require("./passwordResetRoutes");

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
// - Password recovery uses the registered mobile number + Arkesel OTP.
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

// Password recovery is SMS-first. The dedicated router is mounted before
// the legacy controller routes so the registered mobile number and Arkesel
// OTP flow are authoritative.
router.use(passwordResetRoutes);

// Legacy password reset handlers are retained in the controller for
// compatibility with older integrations, but are not reached for these paths.
router.post("/forgot-password", forgotPassword);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password", changePassword);
router.get("/me", me);
router.post("/logout", logout);

module.exports = router;
