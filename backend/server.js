const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");
const User = require("./models/User");
const { startBirthdayJob } = require("./jobs/birthdayMessages");
const { ensureElectoralGeography } = require("./scripts/ensureElectoralGeography");

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not configured.");
  console.error("Please configure MONGODB_URI in the private environment.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");

    const migration = await User.updateMany(
      { platformRole: "user", accountStatus: "pending" },
      { $set: { accountStatus: "approved", approvedAt: new Date(), approvedBy: null } }
    );
    console.log(`👤 Personal accounts auto-approved: ${migration.modifiedCount || 0}`);

    const arkeselConfigured = Boolean(process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY);
    console.log(`📱 Arkesel OTP/SMS configured: ${arkeselConfigured ? "YES" : "NO"}`);

    await ensureElectoralGeography();

    startBirthdayJob();

    app.listen(PORT, () => {
      console.log(`🚀 PoliSync Africa Backend running on port ${PORT}`);
      console.log("📊 Database: MongoDB + Mongoose");
      console.log(`🔗 API: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});
