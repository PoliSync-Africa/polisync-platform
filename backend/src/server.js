require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(() => console.log("MongoDB connection failed"));

app.listen(PORT, () => {
  console.log(`POLISYNC AFRICA Backend running on port ${PORT}`);
});
