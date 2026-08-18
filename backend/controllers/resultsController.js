const Result = require("../models/Result");

// Submit Result
exports.submitResult = async (req, res) => {
  try {
    const existing = await Result.findOne({
      pollingStationCode: req.body.pollingStationCode,
      electionYear: req.body.electionYear,
      electionType: req.body.electionType
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Results already submitted for this polling station."
      });
    }

    const result = await Result.create({
      ...req.body,
      submittedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Election result submitted successfully.",
      result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Dashboard
exports.dashboard = async (req, res) => {
  try {
    const results = await Result.find();

    const national = {};
    const regions = {};
    const constituencies = {};

    let totalVotes = 0;
    let pollingStationsReported = results.length;

    results.forEach(result => {
      totalVotes += result.totalVotes;

      for (const [party, votes] of result.votes.entries()) {
        national[party] = (national[party] || 0) + votes;
      }

      if (!regions[result.region]) regions[result.region] = {};

      for (const [party, votes] of result.votes.entries()) {
        regions[result.region][party] =
          (regions[result.region][party] || 0) + votes;
      }

      if (!constituencies[result.constituency]) {
        constituencies[result.constituency] = {};
      }

      for (const [party, votes] of result.votes.entries()) {
        constituencies[result.constituency][party] =
          (constituencies[result.constituency][party] || 0) + votes;
      }
    });

    res.json({
      success: true,
      pollingStationsReported,
      totalVotes,
      national,
      regions,
      constituencies
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Results
exports.getResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("submittedBy", "fullName role")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      results
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
