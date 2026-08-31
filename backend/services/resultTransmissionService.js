const EventEmitter = require("events");
const OrganizationMembership = require("../models/OrganizationMembership");

class ResultTransmissionService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  async transmit(result) {
    if (!result) return { delivered: 0, recipients: [] };

    const organizationId = result.organizationId;
    const regionId = result.regionId;
    const constituencyId = result.constituencyId;

    const memberships = await OrganizationMembership.find({
      organizationId,
      status: "approved",
      role: {
        $in: [
          "national_party_admin",
          "regional_party_admin",
          "constituency_admin",
          "national_observer_admin",
          "regional_observer_admin",
          "constituency_observer_admin",
        ],
      },
    }).select("userId role regionId constituencyId organizationId").lean();

    const recipients = memberships.filter((member) => {
      if (member.role === "national_party_admin" || member.role === "national_observer_admin") return true;
      if (member.role === "regional_party_admin" || member.role === "regional_observer_admin") {
        return String(member.regionId || "") === String(regionId || "");
      }
      if (member.role === "constituency_admin" || member.role === "constituency_observer_admin") {
        return String(member.constituencyId || "") === String(constituencyId || "");
      }
      return false;
    });

    const payload = {
      type: "RESULT_SUBMITTED",
      resultId: String(result._id),
      organizationId: String(organizationId),
      electionId: String(result.electionId),
      pollingStationId: String(result.pollingStationId),
      pollingStationCode: result.pollingStationCode,
      regionId: String(regionId),
      constituencyId: String(constituencyId),
      verificationStatus: result.verificationStatus,
      manualTotals: result.manualTotals,
      candidateResults: result.candidateResults,
      createdAt: result.createdAt || new Date(),
    };

    this.emit("result", payload, recipients);
    return { delivered: recipients.length, recipients: recipients.map((item) => String(item.userId)), payload };
  }
}

module.exports = new ResultTransmissionService();
