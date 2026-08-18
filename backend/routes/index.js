const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "PoliSync Africa API is running"
  });
});

module.exports = router;
