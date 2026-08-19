const Result = require("../models/Result");
const Election = require("../models/Election");
const { logEvent } = require("../services/audit/logEvent");

// Submit Result
exports.submitResult = async (req, res) => {
  try {
    const {
      electionId,
      pollingStationId,
      candidateResults,
      totalValidVotes,
      rejectedVotes,
      totalBallots,
      evidence
    } = req.body;

    if (!electionId || !pollingStationId) {
      return res.status(400).json({
        success: false,
        message: "Election and polling station are required."
      });
    }

    // Ensure the election belongs to the logged-in organization
    const election = await Election.findOne({
      _id: electionId,
      organizationId: req.user.organizationId
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found for this organization."
      });
    }

    if (election.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Results can only be submitted for an active election."
      });
    }

    // Prevent duplicate submission for the same organization,
    // election and polling station
    const existingResult = await Result.findOne({
      organizationId: req.user.organizationId,
      electionId,
      pollingStationId
    });

    if (existingResult) {
      return res.status(409).json({
        success: false,
        message: "A result has already been submitted for this polling station."
      });
    }

    const result = await Result.create({
      organizationId: req.user.organizationId,
      electionId,
      pollingStationId,
      submittedBy: req.user._id,
      candidateResults,
      totalValidVotes,
      rejectedVotes,
      totalBallots,
      evidence
    });

    await logEvent({
      stationId: pollingStationId,
      electionId,
      userId: req.user._id,
      action: "RESULT_CREATED",
      description: "Polling station result submitted."
    });

    res.status(201).json({
      success: true,
      message: "Election result submitted successfully.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Results for an Election
exports.getElectionResults = async (req, res) => {
  try {
    const election = await Election.findOne({
      _id: req.params.electionId,
      organizationId: req.user.organizationId
    });

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found for this organization."
      });
    }

    const results = await Result.find({
      organizationId: req.user.organizationId,
      electionId: req.params.electionId
    })
      .populate(
        "pollingStationId",
        "code name country region district constituency electoralArea"
      )
      .populate(
        "submittedBy",
        "firstName lastName role"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Result
exports.verifyResult = async (req, res) => {
  try {
    const result = await Result.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found for this organization."
      });
    }

    if (result.verificationStatus === "verified") {
      return res.status(400).json({
        success: false,
        message: "Result is already verified."
      });
    }

    result.verificationStatus = "verified";
    result.verifiedBy = req.user._id;
    result.verifiedAt = new Date();

    await result.save();

    await logEvent({
      stationId: result.pollingStationId,
      electionId: result.electionId,
      userId: req.user._id,
      action: "RESULT_APPROVED",
      description: "Polling station result verified."
    });

    res.json({
      success: true,
      message: "Result verified successfully.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
