const Election = require("../models/Election");

// Create Election
exports.createElection = async (req, res) => {
  try {
    const election = await Election.create(req.body);

    res.status(201).json({
      success: true,
      election,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Election — restricted to the super-admin route
exports.updateElection = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "year",
      "type",
      "country",
      "status",
      "totalPollingStations",
    ];

    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    const election = await Election.findByIdAndUpdate(
      req.params.electionId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found.",
      });
    }

    res.json({
      success: true,
      election,
    });
  } catch (error) {
    const status = error.name === "CastError" ? 400 : 500;
    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Elections
exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      elections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
