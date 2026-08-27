const express = require("express");

const {
  register,
  login,
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
} = require("../controllers/authController");

const router = express.Router();

// ============================================================
// POLISYNC AFRICA — AUTHENTICATION ROUTES
// ============================================================

// FORM DATA SUPPORT

router.use(
  express.urlencoded({
    extended: false,
  })
);

// ============================================================
// AUTH STATUS
// ============================================================

router.get(
  "/",
  (req, res) => {
    res.json({
      success: true,
      message:
        "PoliSync Africa Authentication API is running.",
    });
  }
);

// ============================================================
// REGISTRATION
// ============================================================

router.post(
  "/register",
  register
);

// ============================================================
// LOGIN
// ============================================================

router.post(
  "/login",
  login
);

// ============================================================
// EMAIL VERIFICATION
// ============================================================

router.post(
  "/verify-email",
  verifyEmail
);

// ============================================================
// PHONE VERIFICATION
// ============================================================

router.post(
  "/verify-phone",
  verifyPhone
);

// ============================================================
// RESEND EMAIL VERIFICATION
// ============================================================

router.post(
  "/resend-email-verification",
  resendEmailVerification
);

// ============================================================
// RESEND PHONE VERIFICATION
// ============================================================

router.post(
  "/resend-phone-verification",
  resendPhoneVerification
);

// ============================================================
// LOGIN PHONE OTP
// ============================================================
//
// This is the OTP issued after successful
// email + password authentication.
//
// Body:
//
// {
//   email,
//   code,
//   challengeToken
// }
//
// ============================================================

router.post(
  "/verify-login-otp",
  verifyLoginOTP
);

// ============================================================
// FORGOT PASSWORD
// ============================================================

router.post(
  "/forgot-password",
  forgotPassword
);

// ============================================================
// VERIFY PASSWORD RESET
// ============================================================

router.post(
  "/verify-password-reset",
  verifyPasswordReset
);

// ============================================================
// RESET PASSWORD
// ============================================================

router.post(
  "/reset-password",
  resetPassword
);

// ============================================================
// CHANGE PASSWORD
// ============================================================

router.post(
  "/change-password",
  changePassword
);

// ============================================================
// AUTHENTICATED USER
// ============================================================

router.get(
  "/me",
  me
);

// ============================================================
// LOGOUT
// ============================================================

router.post(
  "/logout",
  logout
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
