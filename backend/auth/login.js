const login = async (email, password) => {
  // ============================================================
  // POLISYNC AFRICA LOGIN HELPER
  // ============================================================
  // Sign in uses:
  //   1. Email
  //   2. Password
  //
  // No Google, Apple ID, or Facebook authentication.
  // ============================================================

  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required."
    };
  }

  // Normalize email exactly as the backend does.
  const normalizedEmail =
    String(email)
      .trim()
      .toLowerCase();

  if (!normalizedEmail) {
    return {
      success: false,
      message: "Email address is required."
    };
  }

  if (!password) {
    return {
      success: false,
      message: "Password is required."
    };
  }

  // ------------------------------------------------------------
  // Login request
  // ------------------------------------------------------------
  //
  // This helper currently represents the login request layer.
  // The real authentication is handled by the PoliSync backend
  // auth controller.
  // ------------------------------------------------------------

  return {
    success: true,

    message:
      "Login request received.",

    user: {
      email:
        normalizedEmail,

      role:
        "pending-verification"
    }
  };
};

module.exports = login;
