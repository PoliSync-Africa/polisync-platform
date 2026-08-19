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
    {
      expiresIn: "7d"
    }
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

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email and password are required."
      });
    }

    // Only approved non-privileged roles can be created through normal registration
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

    // Organization is required for party and organizational users
    const organizationRequiredRoles = [
      "party_admin",
      "regional_admin",
      "constituency_officer",
      "electoral_area_coordinator",
      "polling_station_agent"
    ];

    if (
      organizationRequiredRoles.includes(selectedRole) &&
      !organizationId
    ) {
      return res.status(400).json({
        success: false,
        message: "Organization is required for this role."
      });
    }

    // Country is required for country-based users
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Country is required."
      });
    }

    // Validate organization when one is supplied
    if (organizationId) {
      const organization = await Organization.findById(organizationId);

      if (!organization || !organization.isActive) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive organization."
        });
      }
    }

    // Check whether email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      organizationId: organizationId || undefined,
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
      pollingStation
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: generateToken(user),
      user: {
        id: user._id,
        organizationId: user.organizationId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        country: user.country,
        region: user.region,
        constituency: user.constituency,
        electoralArea: user.electoralArea,
        pollingStation: user.pollingStation
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// ===============================
// LOGIN USER
// ===============================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    user.lastLogin = new Date();

    await user.save();

    res.json({
      success: true,
      message: "Login successful.",
      token: generateToken(user),
      user: {
        id: user._id,
        organizationId: user.organizationId,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        country: user.country,
        region: user.region,
        constituency: user.constituency,
        electoralArea: user.electoralArea,
        pollingStation: user.pollingStation
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
