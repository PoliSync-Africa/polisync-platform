const express = require("express");
const connectDB = require("./config/database");

const app = express();

const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");

const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

app.use(express.json());

// Main API
app.use("/", indexRoutes);

// Authentication
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`POLISYNC server running on port ${PORT}`);
});
