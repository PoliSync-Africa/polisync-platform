const mongoose = require("mongoose");
const Country = require("../models/Country");
const AdminArea = require("../models/AdminArea");
const PollingStation = require("../models/PollingStation");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");

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
    const {
      pollingStationCode,
      name,
      regionId,
      constituencyId,
      district,
      stationType,
      source,
      sourceYear,
      isActive,
    } = req.body;

    if (
      typeof pollingStationCode !== "string" ||
      !pollingStationCode.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      !district ||
      !mongoose.Types.ObjectId.isValid(regionId) ||
      !mongoose.Types.ObjectId.isValid(constituencyId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "pollingStationCode, name, regionId, constituencyId and district are required.",
      });
    }

    const [region, constituency] = await Promise.all([
      Region.findOne({ _id: regionId, isActive: true })
        .select("_id")
        .lean(),
      Constituency.findOne({ _id: constituencyId, isActive: true })
        .select("_id regionId district")
        .lean(),
    ]);

    if (!region || !constituency) {
      return res.status(400).json({
        success: false,
        message: "The supplied region or constituency is invalid or inactive.",
      });
    }

    if (String(constituency.regionId) !== String(region._id)) {
      return res.status(400).json({
        success: false,
        message: "The constituency does not belong to the supplied region.",
      });
    }

    if (String(district).trim() !== String(constituency.district).trim()) {
      return res.status(400).json({
        success: false,
        message: "The polling-station district does not match the constituency.",
      });
    }

    const normalizedCode = pollingStationCode.trim().toUpperCase();
    const existingStation = await PollingStation.findOne({
      pollingStationCode: normalizedCode,
    })
      .select("_id")
      .lean();

    if (existingStation) {
      return res.status(409).json({
        success: false,
        message: "A polling station with this EC code already exists.",
      });
    }

    const station = await PollingStation.create({
      pollingStationCode: normalizedCode,
      name: name.trim(),
      regionId: region._id,
      constituencyId: constituency._id,
      district: String(district).trim(),
      stationType: stationType || "ordinary",
      source:
        typeof source === "string" && source.trim()
          ? source.trim()
          : undefined,
      sourceYear: sourceYear ?? undefined,
      isActive: isActive === undefined ? true : Boolean(isActive),
    });

    res.status(201).json({
      success: true,
      station,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A polling station with this EC code already exists.",
      });
    }

    if (error?.name === "ValidationError" || error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid polling-station data.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Unable to create polling station.",
    });
  }
};
