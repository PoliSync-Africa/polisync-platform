require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

// ============================================================
// POLISYNC AFRICA — SUPER ADMIN BOOTSTRAP
// ============================================================

const SUPER_ADMIN = {
  displayName: "POLISYNC AFRICA",
  username: "polisync.africa",
  email: "danielamonyamekye@gmail.com",
  phone: "+233540992581",
};

// ============================================================
// ENVIRONMENT
// ============================================================

const MONGODB_URI =
  process.env.MONGODB_URI;

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

if (
  SUPER_ADMIN_PASSWORD.length < 8
) {
  console.error(
    "ERROR: SUPER_ADMIN_PASSWORD must contain at least 8 characters."
  );
  process.exit(1);
}

// ============================================================
// BOOTSTRAP SUPER ADMIN
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

    // ========================================================
    // CONNECT DATABASE
    // ========================================================

    console.log(
      "Connecting to MongoDB..."
    );

    await mongoose.connect(
      MONGODB_URI
    );

    console.log(
      "✓ MongoDB connected.\n"
    );

    // ========================================================
    // FIND EXISTING SUPER ADMIN
    // ========================================================

    let user =
      await User.findOne({
        platformRole:
          "super_admin",
      });

    // ========================================================
    // EXISTING SUPER ADMIN
    // ========================================================

    if (user) {
      console.log(
        "Existing Super Admin found."
      );

      console.log(
        `Username: ${user.username}`
      );

      console.log(
        `Email: ${user.email}`
      );

      // ------------------------------------------------------
      // ENSURE PLATFORM IDENTITY
      // ------------------------------------------------------

      user.platformRole =
        "super_admin";

      user.displayName =
        "POLISYNC AFRICA";

      user.username =
        "polisync.africa";

      user.firstName =
        "POLISYNC";

      user.middleName =
        "";

      user.lastName =
        "AFRICA";

      // ------------------------------------------------------
      // ENSURE PRIVATE CONTACT DETAILS
      // ------------------------------------------------------

      user.email =
        SUPER_ADMIN.email;

      user.phone =
        SUPER_ADMIN.phone;

      // ------------------------------------------------------
      // SUPER ADMIN ACCOUNT STATUS
      // ------------------------------------------------------

      user.accountStatus =
        "approved";

      if (!user.approvedAt) {
        user.approvedAt =
          new Date();
      }

      user.suspendedAt =
        null;

      user.suspensionReason =
        null;

      // ------------------------------------------------------
      // SUPER ADMIN VERIFICATION
      // ------------------------------------------------------
      //
      // Super Admin is a platform-controlled account.
      //
      // Email and phone are therefore treated as verified
      // during the bootstrap process.
      //
      // The 24-hour LOGIN OTP security layer remains active.
      // ------------------------------------------------------

      user.emailVerified =
        true;

      user.phoneVerified =
        true;

      // ------------------------------------------------------
      // SECURITY SETTINGS
      // ------------------------------------------------------

      user.twoFactorEnabled =
        false;

      user.twoFactorMethod =
        null;

      user.passcodeEnabled =
        false;

      user.biometricEnabled =
        false;

      // ------------------------------------------------------
      // FORCE LOGIN OTP ON NEXT LOGIN
      // ------------------------------------------------------
      //
      // Setting this to null means the Super Admin has no
      // current 24-hour login-phone verification window.
      //
      // Therefore the next successful password login will
      // require the mandatory phone OTP.
      // ------------------------------------------------------

      user.lastPhoneVerificationAt =
        null;

      // ------------------------------------------------------
      // PRIVACY
      // ------------------------------------------------------

      user.privacy = {
        messagePrivacy:
          "nobody",

        profileVisibility:
          "nobody",
      };

      // ------------------------------------------------------
      // DISPLAY SETTINGS
      // ------------------------------------------------------

      user.displaySettings = {
        skin: "default",

        theme: "system",

        fontStyle: "default",

        fontSize: "medium",
      };

      // ------------------------------------------------------
      // SAVE EXISTING SUPER ADMIN
      // ------------------------------------------------------

      await user.save();

      console.log(
        "\n✓ Existing Super Admin has been updated."
      );

      console.log(
        "✓ Email verification: VERIFIED"
      );

      console.log(
        "✓ Phone verification: VERIFIED"
      );

      console.log(
        "✓ Account status: APPROVED"
      );

      console.log(
        "✓ Next login will require phone OTP."
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
        "\nPrivate account email and phone remain"
      );

      console.log(
        "private account credentials."
      );

      await mongoose.disconnect();

      console.log(
        "\nMongoDB connection closed."
      );

      process.exit(0);
    }

    // ========================================================
    // NO SUPER ADMIN — CHECK EMAIL
    // ========================================================

    const existingEmail =
      await User.findOne({
        email:
          SUPER_ADMIN.email,
      });

    if (existingEmail) {
      console.error(
        "ERROR: This email already belongs to another account."
      );

      console.error(
        `Email: ${SUPER_ADMIN.email}`
      );

      await mongoose.disconnect();

      process.exit(1);
    }

    // ========================================================
    // CHECK PHONE
    // ========================================================

    const existingPhone =
      await User.findOne({
        phone:
          SUPER_ADMIN.phone,
      });

    if (existingPhone) {
      console.error(
        "ERROR: This phone number already belongs to another account."
      );

      console.error(
        `Phone: ${SUPER_ADMIN.phone}`
      );

      await mongoose.disconnect();

      process.exit(1);
    }

    // ========================================================
    // CHECK USERNAME
    // ========================================================

    const existingUsername =
      await User.findOne({
        username:
          SUPER_ADMIN.username,
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

    // ========================================================
    // HASH PASSWORD
    // ========================================================

    console.log(
      "Hashing Super Admin password..."
    );

    const hashedPassword =
      await bcrypt.hash(
        SUPER_ADMIN_PASSWORD,
        12
      );

    // ========================================================
    // CREATE SUPER ADMIN
    // ========================================================

    user =
      await User.create({
        platformRole:
          "super_admin",

        displayName:
          SUPER_ADMIN.displayName,

        username:
          SUPER_ADMIN.username,

        firstName:
          "POLISYNC",

        middleName:
          "",

        lastName:
          "AFRICA",

        dateOfBirth:
          null,

        nationality:
          "Ghanaian",

        identificationType:
          null,

        identificationNumber:
          null,

        email:
          SUPER_ADMIN.email,

        phone:
          SUPER_ADMIN.phone,

        password:
          hashedPassword,

        // Super Admin bootstrap verification.
        emailVerified:
          true,

        phoneVerified:
          true,

        twoFactorEnabled:
          false,

        twoFactorMethod:
          null,

        passcodeEnabled:
          false,

        biometricEnabled:
          false,

        accountStatus:
          "approved",

        approvedAt:
          new Date(),

        approvedBy:
          null,

        suspendedAt:
          null,

        suspensionReason:
          null,

        // Force mandatory login OTP on first login.
        lastPhoneVerificationAt:
          null,

        lastLoginAt:
          null,

        privacy: {
          messagePrivacy:
            "nobody",

          profileVisibility:
            "nobody",
        },

        displaySettings: {
          skin:
            "default",

          theme:
            "system",

          fontStyle:
            "default",

          fontSize:
            "medium",
        },
      });

    // ========================================================
    // SUCCESS
    // ========================================================

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
      "Email verification: VERIFIED"
    );

    console.log(
      "Phone verification: VERIFIED"
    );

    console.log(
      "Login OTP: REQUIRED ON FIRST LOGIN"
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
      "SUPER ADMIN BOOTSTRAP FAILED"
    );

    console.error(
      "=============================================="
    );

    console.error(
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch {
      // Ignore disconnect errors.
    }

    process.exit(1);
  }
}

// ============================================================
// START
// ============================================================

createSuperAdmin();
