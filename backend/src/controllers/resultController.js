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

// Get Results for One Election
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

// Get All Results for Current Organization
exports.getResults = async (req, res) => {
  try {
    const results = await Result.find({
      organizationId: req.user.organizationId
    })
      .populate(
        "pollingStationId",
        "code name country region district constituency electoralArea"
      )
      .populate(
        "submittedBy",
        "firstName lastName role"
      )
      .populate(
        "electionId",
        "title type country electionDate status"
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

// Organization Dashboard
exports.dashboard = async (req, res) => {
  try {
    const results = await Result.find({
      organizationId: req.user.organizationId
    }).lean();

    const national = {};
    const regions = {};
    const constituencies = {};

    let totalValidVotes = 0;
    let rejectedVotes = 0;
    let totalBallots = 0;

    results.forEach((result) => {
      totalValidVotes += result.totalValidVotes || 0;
      rejectedVotes += result.rejectedVotes || 0;
      totalBallots += result.totalBallots || 0;

      (result.candidateResults || []).forEach((candidate) => {
        national[candidate.candidateId] =
          national[candidate.candidateId] || {
            candidateId: candidate.candidateId,
            candidateName: candidate.candidateName,
            party: candidate.party,
            votes: 0
          };

        national[candidate.candidateId].votes += candidate.votes || 0;
      });
    });

    const pollingStationsReported = results.length;

    res.json({
      success: true,
      pollingStationsReported,
      totalValidVotes,
      rejectedVotes,
      totalBallots,
      national: Object.values(national).sort(
        (a, b) => b.votes - a.votes
      ),
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
