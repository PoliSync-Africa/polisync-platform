const bcrypt = require("bcryptjs");
const User = require("../models/User");

const SUPER_ADMIN_EMAIL = "danielamonyamekye@gmail.com";
const SUPER_ADMIN_PHONE = "+233540992581";
const SUPER_ADMIN_USERNAME = "polisync.africa";

const SUPER_ADMIN_PUBLIC_IDENTITY = {
  displayName: "POLISYNC AFRICA",
  username: SUPER_ADMIN_USERNAME,
  firstName: "POLISYNC",
  middleName: "",
  lastName: "AFRICA",
};

/**
 * Restores the canonical PoliSync Africa platform identity if it has
 * accidentally been downgraded to an ordinary user account.
 *
 * The designated platform identity is intentionally not controlled by
 * ordinary organization-role management. This repair is safe to run on
 * every backend startup and does not change an existing password.
 */
async function ensureSuperAdminIdentity() {
  let user = await User.findOne({
    $or: [
      { email: SUPER_ADMIN_EMAIL },
      { phone: SUPER_ADMIN_PHONE },
      { username: SUPER_ADMIN_USERNAME },
    ],
  }).select("+password");

  if (!user) {
    const password = String(process.env.SUPER_ADMIN_PASSWORD || "");
    if (password.length < 8) {
      console.warn("⚠️ Canonical Super Admin account not found and SUPER_ADMIN_PASSWORD is not configured; skipping creation.");
      return { created: false, repaired: false, found: false };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user = await User.create({
      platformRole: "super_admin",
      ...SUPER_ADMIN_PUBLIC_IDENTITY,
      email: SUPER_ADMIN_EMAIL,
      phone: SUPER_ADMIN_PHONE,
      password: hashedPassword,
      emailVerified: true,
      phoneVerified: true,
      accountStatus: "approved",
      approvedAt: new Date(),
      lastPhoneVerificationAt: null,
    });

    console.log("🔐 Canonical PoliSync Africa Super Admin account created.");
    return { created: true, repaired: true, found: true, userId: user._id.toString() };
  }

  const wasSuperAdmin = user.platformRole === "super_admin";
  const changed =
    !wasSuperAdmin ||
    user.accountStatus !== "approved" ||
    user.emailVerified !== true ||
    user.phoneVerified !== true ||
    user.displayName !== SUPER_ADMIN_PUBLIC_IDENTITY.displayName ||
    user.username !== SUPER_ADMIN_PUBLIC_IDENTITY.username;

  if (changed) {
    user.platformRole = "super_admin";
    user.accountStatus = "approved";
    user.approvedAt = user.approvedAt || new Date();
    user.approvedBy = null;
    user.emailVerified = true;
    user.phoneVerified = true;
    user.displayName = SUPER_ADMIN_PUBLIC_IDENTITY.displayName;
    user.username = SUPER_ADMIN_PUBLIC_IDENTITY.username;
    user.firstName = SUPER_ADMIN_PUBLIC_IDENTITY.firstName;
    user.middleName = SUPER_ADMIN_PUBLIC_IDENTITY.middleName;
    user.lastName = SUPER_ADMIN_PUBLIC_IDENTITY.lastName;
    await user.save();

    console.log(`🔐 Canonical PoliSync Africa Super Admin identity repaired (${user._id}).`);
  } else {
    console.log("🔐 Canonical PoliSync Africa Super Admin identity verified.");
  }

  return { created: false, repaired: changed, found: true, userId: user._id.toString() };
}

function isCanonicalSuperAdminIdentity(user) {
  if (!user) return false;
  return (
    String(user.email || "").toLowerCase() === SUPER_ADMIN_EMAIL ||
    String(user.phone || "") === SUPER_ADMIN_PHONE ||
    String(user.username || "").toLowerCase() === SUPER_ADMIN_USERNAME
  );
}

module.exports = {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PHONE,
  SUPER_ADMIN_USERNAME,
  ensureSuperAdminIdentity,
  isCanonicalSuperAdminIdentity,
};
