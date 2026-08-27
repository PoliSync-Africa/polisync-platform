const Country = require("../models/Country");
const AdminArea = require("../models/AdminArea");
const PollingStation = require("../models/PollingStation");

// Create Country
exports.createCountry = async (req, res) => {
  try {
    const country = await Country.create(req.body);

    res.status(201).json({
      success: true,
      country,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Countries
exports.getCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });

    res.json({
      success: true,
      countries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Administrative Area
exports.createArea = async (req, res) => {
  try {
    const area = await AdminArea.create(req.body);

    res.status(201).json({
      success: true,
      area,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Create Polling Station
exports.createPollingStation = async (req, res) => {
  try {
    const station = await PollingStation.create(req.body);

    res.status(201).json({
      success: true,
      station,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
