require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA SUPER ADMIN
// ============================================================

const SUPER_ADMIN = {
  displayName: "POLISYNC AFRICA",
  username: "polisync.africa",

  // Private account contact details.
  // These are NOT the public platform identity.
  email: "danielamonyamekye@gmail.com",
  phone: "+233540992581",
};

// ============================================================
// ENVIRONMENT
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI;

const SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD;

if (!MONGODB_URI) {
  console.error(
    "ERROR: MONGODB_URI is not configured."
  );
  process.exit(1);
}

if (!SUPER_ADMIN_PASSWORD) {
  console.error(
    "ERROR: SUPER_ADMIN_PASSWORD is not configured."
  );
  process.exit(1);
}

if (SUPER_ADMIN_PASSWORD.length < 8) {
  console.error(
    "ERROR: SUPER_ADMIN_PASSWORD must contain at least 8 characters."
  );
  process.exit(1);
}

// ============================================================
// CREATE SUPER ADMIN
// ============================================================

async function createSuperAdmin() {
  try {
    console.log(
      "\n=============================================="
    );

    console.log(
      "POLISYNC AFRICA"
    );

    console.log(
      "SUPER ADMIN BOOTSTRAP"
    );

    console.log(
      "==============================================\n"
    );

    // --------------------------------------------------------
    // CONNECT DATABASE
    // --------------------------------------------------------

    console.log(
      "Connecting to MongoDB..."
    );

    await mongoose.connect(
      MONGODB_URI
    );

    console.log(
      "✓ MongoDB connected.\n"
    );

    // --------------------------------------------------------
    // CHECK EXISTING SUPER ADMIN
    // --------------------------------------------------------

    const existingSuperAdmin =
      await User.findOne({
        platformRole: "super_admin",
      });

    if (existingSuperAdmin) {
      console.log(
        "A Super Admin already exists."
      );

      console.log(
        `Public identity: ${existingSuperAdmin.displayName || "POLISYNC AFRICA"}`
      );

      console.log(
        `Username: ${existingSuperAdmin.username}`
      );

      console.log(
        "\nNo new Super Admin was created."
      );

      await mongoose.disconnect();
      process.exit(0);
    }

    // --------------------------------------------------------
    // CHECK EMAIL
    // --------------------------------------------------------

    const existingEmail =
      await User.findOne({
        email: SUPER_ADMIN.email,
      });

    if (existingEmail) {
      console.error(
        "ERROR: This email already belongs to an account."
      );

      console.error(
        `Email: ${SUPER_ADMIN.email}`
      );

      await mongoose.disconnect();
      process.exit(1);
    }

    // --------------------------------------------------------
    // CHECK PHONE
    // --------------------------------------------------------

    const existingPhone =
      await User.findOne({
        phone: SUPER_ADMIN.phone,
      });

    if (existingPhone) {
      console.error(
        "ERROR: This phone number already belongs to an account."
      );

      console.error(
        `Phone: ${SUPER_ADMIN.phone}`
      );

      await mongoose.disconnect();
      process.exit(1);
    }

    // --------------------------------------------------------
    // CHECK USERNAME
    // --------------------------------------------------------

    const existingUsername =
      await User.findOne({
        username: SUPER_ADMIN.username,
      });

    if (existingUsername) {
      console.error(
        "ERROR: The POLISYNC AFRICA username already exists."
      );

      console.error(
        `Username: ${SUPER_ADMIN.username}`
      );

      await mongoose.disconnect();
      process.exit(1);
    }

    // --------------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------------

    console.log(
      "Hashing Super Admin password..."
    );

    const hashedPassword =
      await bcrypt.hash(
        SUPER_ADMIN_PASSWORD,
        12
      );

    // --------------------------------------------------------
    // CREATE PLATFORM ACCOUNT
    // --------------------------------------------------------

    const user =
      await User.create({
        platformRole: "super_admin",

        displayName:
          SUPER_ADMIN.displayName,

        username:
          SUPER_ADMIN.username,

        // Internal platform identity.
        // This is NOT displayed to other users.
        firstName: "POLISYNC",

        middleName: "",

        lastName: "AFRICA",

        // Super Admin does not use ordinary-user
        // personal identification requirements.
        dateOfBirth: null,

        nationality: "Ghanaian",

        identificationType: null,

        identificationNumber: null,

        // Private account contact details.
        email: SUPER_ADMIN.email,

        phone: SUPER_ADMIN.phone,

        password: hashedPassword,

        emailVerified: false,

        phoneVerified: false,

        twoFactorEnabled: false,

        twoFactorMethod: null,

        passcodeEnabled: false,

        biometricEnabled: false,

        // Super Admin is immediately approved.
        accountStatus: "approved",

        approvedAt: new Date(),

        approvedBy: null,

        suspendedAt: null,

        suspensionReason: null,

        privacy: {
          messagePrivacy: "nobody",
          profileVisibility: "nobody",
        },

        displaySettings: {
          skin: "default",
          theme: "system",
          fontStyle: "default",
          fontSize: "medium",
        },

        lastLoginAt: null,
      });

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    console.log(
      "\n=============================================="
    );

    console.log(
      "SUPER ADMIN CREATED SUCCESSFULLY"
    );

    console.log(
      "=============================================="
    );

    console.log(
      `Platform: ${user.displayName}`
    );

    console.log(
      `Username: ${user.username}`
    );

    console.log(
      `Account email: ${user.email}`
    );

    console.log(
      `Account phone: ${user.phone}`
    );

    console.log(
      `Platform role: ${user.platformRole}`
    );

    console.log(
      `Account status: ${user.accountStatus}`
    );

    console.log(
      "=============================================="
    );

    console.log(
      "\nPublic identity:"
    );

    console.log(
      "POLISYNC AFRICA"
    );

    console.log(
      "@polisync.africa"
    );

    console.log(
      "\nThe private account email and phone"
    );

    console.log(
      "must never be exposed as the public identity."
    );

    console.log(
      "\n==============================================\n"
    );

    await mongoose.disconnect();

    console.log(
      "MongoDB connection closed."
    );

    process.exit(0);

  } catch (error) {
    console.error(
      "\n=============================================="
    );

    console.error(
      "SUPER ADMIN CREATION FAILED"
    );

    console.error(
      "=============================================="
    );

    console.error(
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors.
    }

    process.exit(1);
  }
}

// ============================================================
// START
// ============================================================

createSuperAdmin();
