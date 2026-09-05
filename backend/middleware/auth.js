const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "polisync-secret"
    );

    // NOTE: login()/verifyLoginOTP() in authController.js sign the JWT
    // payload with a "userId" field (not "id"). Reading "id" here always
    // resolved to undefined, so every authenticated request after a
    // successful login failed with 401. Read "userId" to match the
    // tokens actually issued by the platform.
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    // NOTE: the User model has no "role" field — platform-level access is
    // "platformRole" ("user" | "super_admin"); organization-level roles
    // (national_admin, regional_admin, constituency_admin,
    // polling_station_agent, presidential_candidate,
    // parliamentary_candidate) live on OrganizationMembership, not on the
    // user/JWT. Checking req.user.role always evaluated to undefined and
    // every authorize()-gated route always returned 403.
    if (!req.user || !roles.includes(req.user.platformRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action.",
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
