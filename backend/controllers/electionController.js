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
