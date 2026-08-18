const express = require("express");
const connectDB = require("./config/database");

const app = express();

const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const resultsRoutes = require("./routes/results");
const electionRoutes = require("./routes/elections");
const adminRoutes = require("./routes/admin");
const healthRoutes = require("./routes/health");

const PORT = process.env.PORT || 5000;

connectDB();

app.use(express.json());

app.use("/", indexRoutes);
app.use("/auth", authRoutes);
app.use("/results", resultsRoutes);
app.use("/elections", electionRoutes);
app.use("/admin", adminRoutes);
app.use("/health", healthRoutes);

app.listen(PORT, () => {
  console.log(`POLISYNC server running on port ${PORT}`);
});
