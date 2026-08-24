const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/Organization");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organizationId: user.organizationId,
      country: user.country
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ===============================
// REGISTER USER
// ===============================
exports.register = async (req, res) => {
  try {
    const {
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      country,
      region,
      constituency,
      electoralArea,
      pollingStation
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email and password are required."
      });
    }

    const allowedPublicRoles = [
      "observer",
      "polling_station_agent",
      "electoral_area_coordinator",
      "constituency_officer",
      "regional_admin",
      "party_admin"
    ];

    const selectedRole = role || "observer";

    if (!allowedPublicRoles.includes(selectedRole)) {
      return res.status(403).json({
        success: false,
        message: "This role cannot be created through public registration."
      });
    }

    const organizationRequiredRoles = [
      "party_admin",
      "regional_admin",
      "constituency_officer",
      "electoral_area_coordinator",
      "polling_station_agent"
    ];

    if (organizationRequiredRoles.includes(selectedRole) && !organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization is required for this role."
      });
    }

    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Country is required."
      });
    }

    // Verify organization exists
    if (organizationId) {
      const organization = await Organization.findById(organizationId);
      if (!organization) {
        return res.status(400).json({
          success: false,
          message: "Invalid organization."
        });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role: selectedRole,
      country,
      region,
      constituency,
      electoralArea,
      pollingStation,
      isActive: true
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: generateToken(user),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        country: user.country
      }
    });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Registration failed."
    });
  }
};

// ===============================
// LOGIN USER
// ===============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or inactive user."
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: "Login successful.",
      token: generateToken(user),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        country: user.country
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Login failed."
    });
  }
};

// ===============================
// FORGOT PASSWORD
// ===============================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // TODO: Implement password reset flow (send email with reset token)
    res.json({
      success: true,
      message: "Password reset instructions sent to your email. (Feature coming soon)"
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Password reset failed."
    });
  }
};
