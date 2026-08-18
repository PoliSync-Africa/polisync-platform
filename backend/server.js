const express = require("express");

const app = express();
const indexRoutes = require("./routes/index");

const PORT = process.env.PORT || 5000;

app.use(express.json());

// Main route
app.use("/", indexRoutes);

app.listen(PORT, () => {
  console.log(`POLISYNC server running on port ${PORT}`);
});
