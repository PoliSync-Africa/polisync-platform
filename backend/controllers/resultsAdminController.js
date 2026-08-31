const mongoose = require("mongoose");
const Result = require("../models/Result");

const allowedStatuses = ["pending", "verified", "discrepancy", "disputed", "rejected"];

const baseQuery = () => Result.find({})
  .populate("organizationId", "name organizationType politicalPartyName")
  .populate("electionId", "name year type status")
  .populate("regionId", "name regionNumber")
  .populate("constituencyId", "name constituencyNumber")
  .populate("pollingStationId", "name pollingStationCode")
  .populate("submittedBy", "firstName middleName lastName username email")
  .sort({ createdAt: -1 });

exports.listVerification = async (req, res) => {
  try {
    const status = String(req.query.status || "all");
    const query = {};
    if (status !== "all") {
      if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid verification status." });
      query.verificationStatus = status;
    }
    const results = await baseQuery().where(query).limit(500).lean();
    return res.json({
      success: true,
      results,
      totals: {
        total: results.length,
        pending: results.filter((r) => r.verificationStatus === "pending").length,
        verified: results.filter((r) => r.verificationStatus === "verified").length,
        discrepancy: results.filter((r) => ["discrepancy", "disputed"].includes(r.verificationStatus)).length,
        rejected: results.filter((r) => r.verificationStatus === "rejected").length,
      },
    });
  } catch (error) {
    console.error("List result verification error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load result verification records." });
  }
};

exports.updateVerification = async (req, res) => {
  try {
    const { resultId } = req.params;
    const status = String(req.body?.verificationStatus || "").trim();
    const summary = String(req.body?.verificationSummary || "").trim();
    if (!mongoose.Types.ObjectId.isValid(resultId)) return res.status(400).json({ success: false, message: "Invalid result ID." });
    if (!allowedStatuses.includes(status)) return res.status(400).json({ success: false, message: "Invalid verification status." });

    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ success: false, message: "Result not found." });

    result.verificationStatus = status;
    result.verificationSummary = summary || `Super Admin marked this result ${status}.`;
    result.verifiedBy = req.user._id;
    result.verifiedAt = new Date();
    await result.save();

    return res.json({ success: true, message: `Result marked ${status}.`, result });
  } catch (error) {
    console.error("Update result verification error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to update result verification." });
  }
};

exports.listEc8 = async (req, res) => {
  try {
    const results = await baseQuery().where({ "pinkSheetAnalysis.supplied": true }).limit(500).lean();
    return res.json({
      success: true,
      results,
      totals: {
        total: results.length,
        complete: results.filter((r) => r.pinkSheetAnalysis?.status === "complete").length,
        processing: results.filter((r) => r.pinkSheetAnalysis?.status === "processing").length,
        failed: results.filter((r) => r.pinkSheetAnalysis?.status === "failed").length,
        match: results.filter((r) => (r.candidateResults || []).every((c) => c.comparisonStatus === "match")).length,
        discrepancy: results.filter((r) => (r.candidateResults || []).some((c) => c.comparisonStatus === "discrepancy" || c.comparisonStatus === "unreadable")).length,
      },
    });
  } catch (error) {
    console.error("List EC8 verification error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load EC8 verification records." });
  }
};
