const express = require("express");

const {
  register,
  login,
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

const router = express.Router();

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
// LOGOUT
// ============================================================

router.post(
  "/logout",
  logout
);

// ============================================================
// CURRENT AUTHENTICATED USER
// ============================================================

router.get(
  "/me",
  me
);

// ============================================================
// EMAIL VERIFICATION
// ============================================================

router.post(
  "/verify-email",
  verifyEmail
);

router.post(
  "/resend-email-verification",
  resendEmailVerification
);

// ============================================================
// PHONE VERIFICATION
// ============================================================

router.post(
  "/verify-phone",
  verifyPhone
);

router.post(
  "/resend-phone-verification",
  resendPhoneVerification
);

// ============================================================
// PASSWORD RESET
// ============================================================

router.post(
  "/forgot-password",
  forgotPassword
);

router.post(
  "/verify-password-reset",
  verifyPasswordReset
);

router.post(
  "/reset-password",
  resetPassword
);

// ============================================================
// CHANGE PASSWORD
// ============================================================
//
// This route requires authentication middleware.
//
// IMPORTANT:
// If your project already has an authentication middleware,
// replace the comment below with your existing middleware.
//
// Example:
//
// const { protect } = require("../middleware/authMiddleware");
//
// router.post(
//   "/change-password",
//   protect,
//   changePassword
// );
//
// Until the middleware is connected, the controller itself
// checks req.user.
// ============================================================

router.post(
  "/change-password",
  changePassword
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;
