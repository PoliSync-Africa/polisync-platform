require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

// Smart Calendar routes

const geoRoutes = require("./routes/geoRoutes");
const gisRoutes = require("./routes/gisRoutes");
// Smart Calendar reminder scheduler
const {
  startReminderScheduler,
} = require("../services/reminderScheduler");

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Smart Calendar API
|--------------------------------------------------------------------------
*/


app.use("/api/geo", geoRoutes);
app.use("/api/gis", gisRoutes);
/*
|--------------------------------------------------------------------------
| Notifications API
|--------------------------------------------------------------------------
*/
app.get("/health", (req, res) => {
  res.json({
    success: true,
    app: "POLISYNC AFRICA Backend",
    status: "healthy"
  });
});
app.use("/api/notifications", notificationRoutes);
/*
==============================
404 Handler
==============================
*/

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found."
  });
});

/*
==============================
Error Handler
==============================
*/

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});
/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(
        `🚀 POLISYNC AFRICA Backend running on port ${PORT}`
      );

      /*
      |--------------------------------------------------------------------------
      | Start Smart Calendar Reminder Scheduler
      |--------------------------------------------------------------------------
      */

      startReminderScheduler();

      console.log(
        "🔔 Smart Calendar Reminder Scheduler started"
      );
    });
  } catch (error) {
    console.error(
      "❌ Database connection failed:",
      error.message
    );

    process.exit(1);
  }
}

startServer();
