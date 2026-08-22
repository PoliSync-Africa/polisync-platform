const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register
exports.register = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      accountType
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please complete all required fields."
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase()
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      accountType
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET || "polisync-secret",
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        accountType: user.accountType,
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

// Forgot Password
exports.forgotPassword = async (req, res) => {
  res.json({
    success: true,
    message: "Password reset feature coming soon."
  });
};
