const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");
const Organization = require("./models/Organization");
const { startBirthdayJob } = require("./jobs/birthdayMessages");
const { ensureElectoralGeography } = require("./scripts/ensureElectoralGeography");
const { ensurePoliticalParties } = require("./scripts/ensurePoliticalParties");
const { installCallSignaling } = require("./realtime/callSignaling");
const { ensureSuperAdminIdentity } = require("./services/superAdminIdentityService");
const { synchronizeAllElectionParties } = require("./services/electionGeographySyncService");

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
    minPoolSize: 1,
    maxIdleTimeMS: 60000,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Start accepting requests immediately after the database connection is ready.
    // Non-critical repair/bootstrap jobs run in the background so cold starts are faster.
    const server = app.listen(PORT, () => {
      console.log(`🚀 PoliSync Africa Backend running on port ${PORT}`);
      console.log("📊 Database: MongoDB + Mongoose");
      console.log(`🔗 API: http://localhost:${PORT}`);
    });

    installCallSignaling(server);
    console.log("📞 Authenticated WebRTC signaling enabled");

    server.requestTimeout = 60 * 1000;
    server.headersTimeout = 70 * 1000;
    server.keepAliveTimeout = 65 * 1000;
    server.maxHeadersCount = 100;

    Promise.allSettled([
      ensureSuperAdminIdentity(),
      ensurePoliticalParties(Organization),
      ensureElectoralGeography(),
      synchronizeAllElectionParties(),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error("⚠️ Background bootstrap failed:", result.reason?.message || result.reason);
        }
      });
      const partySync = results[3];
      if (partySync?.status === "fulfilled") {
        console.log(`🔄 Political parties synchronized: ${partySync.value.parties?.length || 0} parties, ${partySync.value.elections || 0} elections, ${partySync.value.logosImported || 0} logos imported.`);
      }
    });

    startBirthdayJob();
    console.log(`📱 Arkesel OTP/SMS configured: ${Boolean(process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY) ? "YES" : "NO"}`);
  })