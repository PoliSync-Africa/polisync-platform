const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");
const User = require("./models/User");
const Organization = require("./models/Organization");
const { startBirthdayJob } = require("./jobs/birthdayMessages");
const { ensureElectoralGeography } = require("./scripts/ensureElectoralGeography");
const { ensurePoliticalParties } = require("./scripts/ensurePoliticalParties");
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
    maxPoolSize: 20,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Keep the critical startup path short. This identity check is a single
    // targeted repair; larger maintenance jobs run after the API is listening.
    await ensureSuperAdminIdentity();

    const server = app.listen(PORT, () => {
      console.log(`🚀 PoliSync Africa Backend running on port ${PORT}`);
      console.log("📊 Database: MongoDB + Mongoose");
      console.log(`🔗 API: http://localhost:${PORT}`);
    });

    installCallSignaling(server);
    console.log("📞 Authenticated WebRTC signaling enabled");

    server.requestTimeout = 60 * 1000;
    server.headersTimeout = 15 * 1000;
    server.keepAliveTimeout = 10 * 1000;
    server.maxHeadersCount = 100;

    // Non-critical bootstraps intentionally run after the API is ready so a
    // Render restart can accept traffic as soon as MongoDB is connected.
    Promise.allSettled([
      ensurePoliticalParties(Organization),
      ensureElectoralGeography(),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") console.error("⚠️ Background bootstrap failed:", result.reason?.message || result.reason);
      });
    });

    startBirthdayJob();
    console.log(`📱 Arkesel OTP/SMS configured: ${Boolean(process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY) ? "YES" : "NO"}`);
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
