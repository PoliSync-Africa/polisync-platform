const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "POLISYNC AFRICA API",
    status: "Running",
    version: "1.0.0"
  });
});

module.exports = app;
