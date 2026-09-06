const AuditLog = require("../models/AuditLog");
const { buildReconciliationPlan, applyReconciliationPlan } = require("../services/electoralDataReconciliationService");

let applying = false;
exports.preview = async (req, res) => {
  try { return res.json({ success:true, data:await buildReconciliationPlan() }); }
  catch (error) { console.error("Electoral reconciliation preview failed:", error); return res.status(422).json({ success:false, code:"ELECTORAL_RECONCILIATION_REJECTED", message:error.message||"The electoral source failed validation and was not applied." }); }
};
exports.apply = async (req, res) => {
  if (applying) return res.status(409).json({ success:false, code:"ELECTORAL_RECONCILIATION_IN_PROGRESS", message:"Another electoral reconciliation is currently being applied." });
  applying=true;
  try {
    const plan=await buildReconciliationPlan();
    if(!plan.safeToApply) return res.status(422).json({ success:false, code:"ELECTORAL_RECONCILIATION_NOT_SAFE", message:"Reconciliation was blocked because validation findings require review before changes can be applied.", data:plan });
    const result=await applyReconciliationPlan(plan,req.user._id);
    await AuditLog.create({ actor:req.user._id, action:"electoral_reconciliation_applied", resource:"PollingStation", metadata:{source:plan.source,sourceYear:plan.sourceYear,summary:plan.summary,result}, ipAddress:req.ip, userAgent:req.get("user-agent")||null });
    return res.json({success:true,message:"Electoral polling-station reconciliation applied successfully.",result,summary:plan.summary});
  } catch(error) {
    console.error("Electoral reconciliation apply failed:",error);
    await AuditLog.create({actor:req.user._id,action:"electoral_reconciliation_apply_failed",resource:"PollingStation",metadata:{error:error.message},ipAddress:req.ip,userAgent:req.get("user-agent")||null}).catch(()=>{});
    return res.status(422).json({success:false,code:"ELECTORAL_RECONCILIATION_APPLY_FAILED",message:error.message||"The reconciliation was not applied."});
  } finally { applying=false; }
};
