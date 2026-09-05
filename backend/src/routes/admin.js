const express = require("express");
const router = express.Router();
const adminRoutes = require("./routes/admin");
const adminController = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// Countries
router.get("/countries", adminController.getCountries);
router.post(
  "/countries",
  protect,
  authorize("super_admin"),
  adminController.createCountry
);

// Administrative Areas
router.post(
  "/areas",
  protect,
  authorize("super_admin"),
  adminController.createArea
);

// Polling Stations
router.post(
  "/polling-stations",
  protect,
  authorize("super_admin"),
  adminController.createPollingStation
);

module.exports = router;
