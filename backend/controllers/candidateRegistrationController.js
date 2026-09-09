const Election = require("../models/Election");
const Organization = require("../models/Organization");
const { synchronizeAllElectionParties } = require("../services/electionGeographySyncService");

exports.getCandidateRegistrationOptions = async (req, res) => {
  try {
    await synchronizeAllElectionParties();
    const [organizations, elections] = await Promise.all([
      Organization.find({ organizationType: "political_party", organizationStatus: "approved" })
        .select("_id name politicalPartyName logo")
        .lean(),
      Election.find({ status: "Active", type: { $in: ["Presidential", "Parliamentary"] } })
        .select("_id name year type status parties")
        .sort({ year: -1, startDateTime: 1, createdAt: -1 })
        .lean(),
    ]);

    const parties = organizations.map((organization) => ({
      id: organization._id,
      name: organization.politicalPartyName || organization.name,
      logoUrl: String(organization.logo || "").trim(),
      registeredInSystem: true,
    }));

    const activeElections = elections.map((election) => ({
      _id: election._id,
      id: election._id,
      name: election.name,
      year: election.year,
      type: election.type,
      status: election.status,
      parties: Array.isArray(election.parties) ? election.parties.map((party) => ({
        partyId: party.partyId || null,
        name: String(party.name || "").trim(),
        logoUrl: String(party.logoUrl || "").trim(),
      })) : [],
    }));

    return res.json({ success: true, parties, elections: activeElections });
  } catch (error) {
    console.error("Candidate registration options error:", error);
    return res.status(500).json({ success: false, message: error.message || "Unable to load candidate registration options." });
  }
};
