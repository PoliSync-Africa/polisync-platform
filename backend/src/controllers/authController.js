const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Organization = require("../models/Organization");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      organizationId: user.organizationId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

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

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "Organization is required."
      });
    }

    const organization = await Organization.findById(organizationId);

    if (!organization || !organization.isActive) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive organization."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      organizationId,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
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
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

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
