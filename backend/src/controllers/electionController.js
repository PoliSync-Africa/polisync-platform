const Election = require("../models/Election");

exports.createElection = async (req, res) => {
  try {
    const election = await Election.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Election created successfully.",
      data: election
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getElections = async (req, res) => {
  try {
    const elections = await Election.find()
      .populate("createdBy", "firstName lastName role")
      .sort({ electionDate: 1 });

    res.json({
      success: true,
      count: elections.length,
      data: elections
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getElectionById = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate("createdBy", "firstName lastName role");

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found."
      });
    }

    res.json({
      success: true,
      data: election
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateElectionStatus = async (req, res) => {
  try {
    const election = await Election.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found."
      });
    }

    res.json({
      success: true,
      message: "Election status updated.",
      data: election
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
