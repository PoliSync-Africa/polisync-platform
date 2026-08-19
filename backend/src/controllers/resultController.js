const Result = require("../models/Result");
const { logEvent } = require("../services/audit/logEvent");

exports.submitResult = async (req, res) => {
  try {
    const result = await Result.create({
      ...req.body,
      submittedBy: req.user._id
    });

    await logEvent({
      stationId: result.pollingStationId,
      electionId: result.electionId,
      userId: req.user._id,
      action: "RESULT_CREATED",
      description: "Polling station result submitted."
    });

    res.status(201).json({
      success: true,
      message: "Result submitted successfully.",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getElectionResults = async (req, res) => {
  try {
    const results = await Result.find({
      electionId: req.params.electionId
    })
      .populate("pollingStationId", "code name constituency")
      .populate("submittedBy", "firstName lastName role");

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

exports.verifyResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndUpdate(
      req.params.id,
      {
        verificationStatus: "verified",
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      },
      { new: true }
    );

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
