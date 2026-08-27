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
} = require("../controllers/authController");

const router = express.Router();

// ============================================================
// POLISYNC AFRICA — AUTHENTICATION ROUTES
// ============================================================
//
// Mounted in app.js as:
//
//     /api/auth
//
// Therefore the complete endpoints are:
//
//     GET  /api/auth/
//
//     POST /api/auth/register
//     POST /api/auth/login
//
//     POST /api/auth/verify-email
//     POST /api/auth/verify-phone
//
//     POST /api/auth/resend-email-verification
//     POST /api/auth/resend-phone-verification
//
//     POST /api/auth/forgot-password
//     POST /api/auth/verify-password-reset
//     POST /api/auth/reset-password
//
//     POST /api/auth/change-password
//     POST /api/auth/logout
//
//     GET  /api/auth/me
//
// ============================================================


// ============================================================
// FORM DATA SUPPORT
// ============================================================

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
// ACCOUNT REGISTRATION
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
// FORGOT PASSWORD
// ============================================================

router.post(
  "/forgot-password",
  forgotPassword
);


// ============================================================
// VERIFY PASSWORD RESET CODE
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
// GET AUTHENTICATED USER
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
// EXPORT ROUTER
// ============================================================

module.exports = router;
