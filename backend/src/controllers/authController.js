const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
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

    if (organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });

      if (!organization || !organization.isActive) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive organization."
        });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
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
        pollingStation
      }
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: generateToken(user),
      user
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

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials."
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    res.json({
      success: true,
      message: "Login successful.",
      token: generateToken(user),
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
