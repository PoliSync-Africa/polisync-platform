const login = async (email, password) => {
  if (!email || !password) {
    return {
      success: false,
      message: "Email and password are required."
    };
  }

  return {
    success: true,
    message: "Login request received.",
    user: {
      email,
      role: "pending-verification"
    }
  };
};

module.exports = login;
