const Result = require("../models/Result");

// Submit Results
exports.submitResult = async (req, res) => {
  try {
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
