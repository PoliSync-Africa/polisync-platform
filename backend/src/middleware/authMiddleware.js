const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Legacy middleware kept compatible with the current authentication contract.
// Organization roles belong to OrganizationMembership; platform access belongs
// to User.platformRole. JWTs issued by authController use userId.
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token required." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "polisync-secret");
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) return res.status(401).json({ success: false, message: "User not found." });
    if (user.isActive === false) return res.status(403).json({ success: false, message: "User account is inactive." });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Authentication required." });
  if (!roles.includes(req.user.platformRole)) return res.status(403).json({ success: false, message: "Access denied." });
  next();
};

module.exports = { protect, authorize };
