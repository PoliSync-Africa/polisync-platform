const express = require("express");

const app = express();

const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");

const PORT = process.env.PORT || 5000;

app.use(express.json());

// Main API
app.use("/", indexRoutes);

// Authentication
app.use("/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`POLISYNC server running on port ${PORT}`);
});
