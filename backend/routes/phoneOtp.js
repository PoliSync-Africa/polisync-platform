const express = require("express");

const {
  verifyLoginPhoneOTP,
  resendLoginPhoneOTP,
} = require("../controllers/phoneOtpController");

const router = express.Router();

// ============================================================
// POLISYNC AFRICA — PHONE OTP ROUTES
// ============================================================

router.post(
  "/verify-login-otp",
  verifyLoginPhoneOTP
);

router.post(
  "/resend-login-otp",
  resendLoginPhoneOTP
);

module.exports = router;
