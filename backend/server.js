const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");
const User = require("./models/User");
const { startBirthdayJob } = require("./jobs/birthdayMessages");
const { ensureElectoralGeography } = require("./scripts/ensureElectoralGeography");
const { installCallSignaling } = require("./realtime/callSignaling");
const { ensureSuperAdminIdentity } = require("./services/superAdminIdentityService");

const rawMongoUri = String(process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
const PORT = process.env.PORT || 5000;

function normalizeMongoUri(uri) {
  if (!uri) return "";
  const value = uri.trim();
  try {
    const parsed = new URL(value);
    if (!/^mongodb(?:\+srv)?:$/i.test(parsed.protocol)) return value;
    if (!parsed.searchParams.has("retryWrites")) parsed.searchParams.set("retryWrites", "true");
    if (!parsed.searchParams.has("w")) parsed.searchParams.set("w", "majority");
    return parsed.toString();
  } catch {
    return value;
  }
}

const MONGODB_URI = normalizeMongoUri(rawMongoUri);

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not configured.");
  console.error("Please configure MONGODB_URI in the private environment.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    family: 4,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // The canonical PoliSync Africa platform identity must never be
    // downgraded to an ordinary user account. Repair it before the API
    // begins accepting requests so the correct privileges are restored
    // immediately after a deployment/restart.
    await ensureSuperAdminIdentity();

    const approvalMigration = await User.updateMany(
      { platformRole: "user", accountStatus: "pending" },
      { $set: { accountStatus: "approved", approvedAt: new Date(), approvedBy: null } }
    );
    console.log(`👤 Personal accounts auto-approved: ${approvalMigration.modifiedCount || 0}`);

    const emailVerificationMigration = await User.updateMany(
      { emailVerified: { $ne: true } },
      { $set: { emailVerified: true } }
    );
    console.log(`📧 Email verification retired for accounts: ${emailVerificationMigration.modifiedCount || 0}`);

    const arkeselConfigured = Boolean(process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY);
    console.log(`📱 Arkesel OTP/SMS configured: ${arkeselConfigured ? "YES" : "NO"}`);

    startBirthdayJob();

    const server = app.listen(PORT, () => {
      console.log(`🚀 PoliSync Africa Backend running on port ${PORT}`);
      console.log("📊 Database: MongoDB + Mongoose");
      console.log(`🔗 API: http://localhost:${PORT}`);

      ensureElectoralGeography().catch((error) => {
        console.error("⚠️ Electoral geography bootstrap failed:", error.message);
      });
    });

    installCallSignaling(server);
    console.log("📞 Authenticated WebRTC signaling enabled");

    server.requestTimeout = 60 * 1000;
    server.headersTimeout = 15 * 1000;
    server.keepAliveTimeout = 5 * 1000;
    server.maxHeadersCount = 100;
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    console.error("ℹ️ Verify the Render MONGODB_URI value, Atlas database username/password, authSource, and Atlas Network Access allowlist.");
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});