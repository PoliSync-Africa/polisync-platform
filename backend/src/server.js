require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const calendarRoutes = require("../routes/calendar");

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| Smart Calendar API
|--------------------------------------------------------------------------
*/
app.use("/api/calendar", calendarRoutes);

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
      console.log(`🚀 POLISYNC AFRICA Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

startServer();
