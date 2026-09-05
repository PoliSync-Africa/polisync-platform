const express = require("express");

const {
  sendLoginPhoneOTP,
  verifyLoginPhoneOTP,
  resendLoginPhoneOTP,
} = require("../controllers/phoneOtpController");

const router = express.Router();

// ============================================================
// POLISYNC AFRICA — PHONE OTP ROUTES
// ============================================================
//
// Mounted in app.js as:
//
//     /api/phone-otp
//
// Therefore:
//
// POST /api/phone-otp/send-login-otp
// POST /api/phone-otp/verify-login-otp
// POST /api/phone-otp/resend-login-otp
//
// ============================================================


// ============================================================
// SEND LOGIN OTP
// ============================================================

router.post(
  "/send-login-otp",
  sendLoginPhoneOTP
);


// ============================================================
// VERIFY LOGIN OTP
// ============================================================

router.post(
  "/verify-login-otp",
  verifyLoginPhoneOTP
);


// ============================================================
// RESEND LOGIN OTP
// ============================================================

router.post(
  "/resend-login-otp",
  resendLoginPhoneOTP
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;
