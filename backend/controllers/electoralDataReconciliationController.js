const { buildReconciliationPlan } = require("../services/electoralDataReconciliationService");

exports.preview = async (req, res) => {
  try {
    const plan = await buildReconciliationPlan();
    return res.json({ success: true, data: plan });
  } catch (error) {
    console.error("Electoral reconciliation preview failed:", error);
    return res.status(422).json({ success: false, code: "ELECTORAL_RECONCILIATION_REJECTED", message: error.message || "The electoral source failed validation and was not applied." });
  }
};
