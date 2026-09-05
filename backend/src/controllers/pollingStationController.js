const PollingStation = require("../models/PollingStation");

// Create Polling Station
exports.createPollingStation = async (req, res) => {
  try {
    const {
      code,
      name,
      country,
      region,
      district,
      constituency,
      electoralArea,
      location,
      assignedAgents
    } = req.body;

    if (!code || !name || !region || !district || !constituency) {
      return res.status(400).json({
        success: false,
        message:
          "Code, name, region, district and constituency are required."
      });
    }

    const existingStation = await PollingStation.findOne({
      organizationId: req.user.organizationId,
      code: code.trim()
    });

    if (existingStation) {
      return res.status(409).json({
        success: false,
        message:
          "A polling station with this code already exists in this organization."
      });
    }

    const pollingStation = await PollingStation.create({
      organizationId: req.user.organizationId,
      code: code.trim(),
      name: name.trim(),
      country: country || "Ghana",
      region,
      district,
      constituency,
      electoralArea,
      location,
      assignedAgents
    });

    res.status(201).json({
      success: true,
      message: "Polling station created successfully.",
      data: pollingStation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Polling Stations
exports.getPollingStations = async (req, res) => {
  try {
    const {
      region,
      district,
      constituency,
      electoralArea,
      status,
      search,
      page = 1,
      limit = 50
    } = req.query;

    const filter = {
      organizationId: req.user.organizationId
    };

    if (region) filter.region = region;
    if (district) filter.district = district;
    if (constituency) filter.constituency = constituency;
    if (electoralArea) filter.electoralArea = electoralArea;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [stations, total] = await Promise.all([
      PollingStation.find(filter)
        .populate("assignedAgents", "firstName lastName role")
        .sort({ region: 1, district: 1, constituency: 1, name: 1 })
        .skip(skip)
        .limit(Number(limit)),

      PollingStation.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: stations.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: stations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Polling Station
exports.getPollingStation = async (req, res) => {
  try {
    const station = await PollingStation.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    }).populate(
      "assignedAgents",
      "firstName lastName role"
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Polling station not found."
      });
    }

    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Polling Station
exports.updatePollingStation = async (req, res) => {
  try {
    const {
      code,
      name,
      country,
      region,
      district,
      constituency,
      electoralArea,
      location,
      assignedAgents,
      status
    } = req.body;

    const station = await PollingStation.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Polling station not found."
      });
    }

    if (code && code.trim() !== station.code) {
      const duplicate = await PollingStation.findOne({
        organizationId: req.user.organizationId,
        code: code.trim(),
        _id: { $ne: req.params.id }
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another polling station already uses this code."
        });
      }
    }

    if (code !== undefined) station.code = code.trim();
    if (name !== undefined) station.name = name.trim();
    if (country !== undefined) station.country = country;
    if (region !== undefined) station.region = region;
    if (district !== undefined) station.district = district;
    if (constituency !== undefined) station.constituency = constituency;
    if (electoralArea !== undefined)
      station.electoralArea = electoralArea;
    if (location !== undefined) station.location = location;
    if (assignedAgents !== undefined)
      station.assignedAgents = assignedAgents;
    if (status !== undefined) station.status = status;

    await station.save();

    res.json({
      success: true,
      message: "Polling station updated successfully.",
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Assign Agents
exports.assignAgents = async (req, res) => {
  try {
    const { assignedAgents } = req.body;

    if (!Array.isArray(assignedAgents)) {
      return res.status(400).json({
        success: false,
        message: "assignedAgents must be an array."
      });
    }

    const station = await PollingStation.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      {
        assignedAgents
      },
      {
        new: true,
        runValidators: true
      }
    ).populate(
      "assignedAgents",
      "firstName lastName role"
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Polling station not found."
      });
    }

    res.json({
      success: true,
      message: "Agents assigned successfully.",
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Activate Polling Station
exports.activatePollingStation = async (req, res) => {
  try {
    const station = await PollingStation.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      {
        status: "active"
      },
      {
        new: true
      }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Polling station not found."
      });
    }

    res.json({
      success: true,
      message: "Polling station activated successfully.",
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Deactivate Polling Station
exports.deactivatePollingStation = async (req, res) => {
  try {
    const station = await PollingStation.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: req.user.organizationId
      },
      {
        status: "inactive"
      },
      {
        new: true
      }
    );

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Polling station not found."
      });
    }

    res.json({
      success: true,
      message: "Polling station deactivated successfully.",
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Polling Station
exports.deletePollingStation = async (req, res) => {
  try {
    const station = await PollingStation.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!station) {
      return res.status(404).json({
        success: false,
        message: "Polling station not found."
      });
    }

    res.json({
      success: true,
      message: "Polling station deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
