const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");
const Organization = require("./models/Organization");
const { startBirthdayJob } = require("./jobs/birthdayMessages");
const { ensureElectoralGeography, refreshElectoralGeography } = require("./scripts/ensureElectoralGeography");
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

async function synchronizePoliticalPartySystem() {
  await ensurePoliticalParties(Organization);
  const result = await synchronizeAllElectionParties();
  console.log(`🔄 Political parties synchronized: ${result.parties?.length || 0} parties, ${result.elections || 0} elections, ${result.logosImported || 0} logos imported.`);
  return result;
}

async function bootstrapElectoralGeography() {
  const current = await ensureElectoralGeography();
  if (Number(current.pollingStations || 0) < 1000) {
    console.log("🗳️ Polling-station register is empty/incomplete on startup; beginning official EC refresh in the background.");
    return refreshElectoralGeography();
  }
  console.log(`🗺️ Electoral geography bootstrap ready: ${current.regions} regions, ${current.constituencies} constituencies, ${current.pollingStations} polling stations.`);
  return current;
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
      bootstrapElectoralGeography(),
      synchronizePoliticalPartySystem(),
    ]).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") console.error("⚠️ Background bootstrap failed:", result.reason?.message || result.reason);
      });
    });

    startBirthdayJob();
    console.log(`📱 Arkesel OTP/SMS configured: ${Boolean(process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY) ? "YES" : "NO"}`);
  })