const bcrypt = require("bcryptjs");
const User = require("../models/User");

const SUPER_ADMIN = {
  displayName: "POLISYNC AFRICA",
  username: "polisync.africa",
  email: "danielamonyamekye@gmail.com",
  phone: "+233540992581",
};

exports.bootstrapSuperAdmin = async (req, res) => {
  try {
    const providedKey = req.query.key || req.headers["x-setup-key"];

    if (!process.env.SUPER_ADMIN_SETUP_KEY) {
      return res.status(500).json({
        success: false,
        message: "SUPER_ADMIN_SETUP_KEY is not configured on the server.",
      });
    }

    if (!providedKey || providedKey !== process.env.SUPER_ADMIN_SETUP_KEY) {
      return res.status(403).json({
        success: false,
        message: "Invalid or missing setup key.",
      });
    }

    if (!process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(500).json({
        success: false,
        message: "SUPER_ADMIN_PASSWORD is not configured on the server.",
      });
    }

    if (process.env.SUPER_ADMIN_PASSWORD.length < 8) {
      return res.status(500).json({
        success: false,
        message: "SUPER_ADMIN_PASSWORD must contain at least 8 characters.",
      });
    }

    let user = await User.findOne({ platformRole: "super_admin" });

    if (user) {
      user.platformRole = "super_admin";
      user.displayName = "POLISYNC AFRICA";
      user.username = "polisync.africa";
      user.firstName = "POLISYNC";
      user.middleName = "";
      user.lastName = "AFRICA";
      user.email = SUPER_ADMIN.email;
      user.phone = SUPER_ADMIN.phone;
      user.accountStatus = "approved";
      if (!user.approvedAt) user.approvedAt = new Date();
      user.suspendedAt = null;
      user.suspensionReason = null;
      user.emailVerified = true;
      user.phoneVerified = true;
      user.twoFactorEnabled = false;
      user.twoFactorMethod = null;
      user.passcodeEnabled = false;
      user.biometricEnabled = false;
      user.lastPhoneVerificationAt = null;
      user.password = await bcrypt.hash(
        process.env.SUPER_ADMIN_PASSWORD,
        12
      );

      await user.save();

      return res.status(200).json({
        success: true,
        message:
          "Existing Super Admin has been updated. Next login requires phone OTP.",
        email: user.email,
        username: user.username,
      });
    }

    const existingEmail = await User.findOne({ email: SUPER_ADMIN.email });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "This email already belongs to another account.",
      });
    }

    const existingPhone = await User.findOne({ phone: SUPER_ADMIN.phone });
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "This phone number already belongs to another account.",
      });
    }

    const existingUsername = await User.findOne({
      username: SUPER_ADMIN.username,
    });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "The POLISYNC AFRICA username already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      12
    );

    user = await User.create({
      platformRole: "super_admin",
      displayName: SUPER_ADMIN.displayName,
      username: SUPER_ADMIN.username,
      firstName: "POLISYNC",
      middleName: "",
      lastName: "AFRICA",
      dateOfBirth: null,
      nationality: "Ghanaian",
      identificationType: null,
      identificationNumber: null,
      email: SUPER_ADMIN.email,
      phone: SUPER_ADMIN.phone,
      password: hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: false,
      twoFactorMethod: null,
      passcodeEnabled: false,
      biometricEnabled: false,
      accountStatus: "approved",
      approvedAt: new Date(),
      approvedBy: null,
      suspendedAt: null,
      suspensionReason: null,
      lastPhoneVerificationAt: null,
      lastLoginAt: null,
    });

    return res.status(201).json({
      success: true,
      message:
        "Super Admin created successfully. Next login requires phone OTP.",
      email: user.email,
      username: user.username,
    });
  } catch (error) {
    console.error("Bootstrap super admin error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to bootstrap Super Admin.",
    });
  }
};
