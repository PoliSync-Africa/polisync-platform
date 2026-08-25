const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./app");

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

// ============================================================
// VALIDATE REQUIRED ENVIRONMENT VARIABLES
// ============================================================

if (!MONGODB_URI) {
  console.error(
    "❌ MONGODB_URI is not configured."
  );

  console.error(
    "Please configure MONGODB_URI in the private environment."
  );

  process.exit(1);
}

// ============================================================
// MONGODB CONNECTION
// ============================================================

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    // ========================================================
    // START SERVER
    // ========================================================

    app.listen(PORT, () => {
      console.log(
        `🚀 PoliSync Africa Backend running on port ${PORT}`
      );

      console.log(
        "📊 Database: MongoDB + Mongoose"
      );

      console.log(
        `🔗 API: http://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "❌ MongoDB Connection Failed:",
      err.message
    );

    process.exit(1);
  });

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

process.on(
  "unhandledRejection",
  (err) => {
    console.error(
      "❌ Unhandled Rejection:",
      err
    );

    process.exit(1);
  }
);
