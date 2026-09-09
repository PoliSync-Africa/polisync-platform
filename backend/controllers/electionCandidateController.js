const Election = require("../models/Election");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");

const MAX_PHOTO_LENGTH = 3 * 1024 * 1024;

async function canManageElection(req, election) {
  if (req.user?.platformRole === "super_admin") return true;
  if (!["Active"].includes(election?.status)) return false;
  const membership = await OrganizationMembership.findOne({
    userId: req.user._id,
    organizationId: election.organizationId,
    role: { $in: ["national_party_admin", "national_observer_admin"] },
    status: "approved",
  }).lean();
  return Boolean(membership);
}

async function getPartyMembership(req) {
  return OrganizationMembership.findOne({
    userId: req.user?._id,
    role: "national_party_admin",
    status: "approved",
    organizationType: "political_party",
  }).lean();
}

function participatingParty(election, partyId) {
  return (election.parties || []).find((party) => String(party.partyId || "") === String(partyId || ""));
}

exports.getMyPartyCandidate = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).lean();
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (election.type !== "Presidential") return res.status(400).json({ success: false, message: "This election does not have a presidential ballot." });
    const membership = await getPartyMembership(req);
    if (!membership) return res.status(403).json({ success: false, message: "Only an approved national political party administrator can submit a party presidential candidate." });
    const party = participatingParty(election, membership.organizationId);
    if (!party) return res.status(403).json({ success: false, message: "Your political party is not a participating party in this election." });
    const candidate = (election.candidates || []).find((item) => item.position === "president" && String(item.partyId || "") === String(membership.organizationId));
    const organization = await Organization.findById(membership.organizationId).select("_id name politicalPartyName logo").lean();
    return res.json({ success: true, readOnly: election.status === "Closed", election: { id: election._id, name: election.name, year: election.year, type: election.type, status: election.status }, party: { id: membership.organizationId, name: party.name || organization?.politicalPartyName || organization?.name, logoUrl: party.logoUrl || organization?.logo || "" }, candidate: candidate || null });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to load your party candidate." }); }
};

exports.submitMyPartyCandidate = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (election.type !== "Presidential") return res.status(400).json({ success: false, message: "This election does not have a presidential ballot." });
    if (election.status !== "Active") return res.status(403).json({ success: false, code: "ELECTION_READ_ONLY", message: "This election is closed. Candidate and election information are read-only for political parties." });
    const membership = await getPartyMembership(req);
    if (!membership) return res.status(403).json({ success: false, message: "Only an approved national political party administrator can submit a party presidential candidate." });
    const party = participatingParty(election, membership.organizationId);
    if (!party) return res.status(403).json({ success: false, message: "Your political party is not a participating party in this election." });

    const name = String(req.body?.name || "").trim();
    const profilePictureUrl = String(req.body?.profilePictureUrl || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Candidate full name is required." });
    if (profilePictureUrl.length > MAX_PHOTO_LENGTH) return res.status(400).json({ success: false, message: "Candidate photo is too large. Please use a smaller image." });

    const candidates = (election.candidates || []).filter((candidate) => !(candidate.position === "president" && String(candidate.partyId || "") === String(membership.organizationId)));
    const organization = await Organization.findById(membership.organizationId).select("logo politicalPartyName name").lean();
    candidates.push({ name, partyId: membership.organizationId, party: party.name, partyLogoUrl: organization?.logo || party.logoUrl || "", profilePictureUrl, constituencyId: null, position: "president", ballotNumber: null });
    election.candidates = candidates;
    await election.save();
    return res.json({ success: true, candidate: candidates[candidates.length - 1], message: `${party.name} presidential candidate saved permanently until your party edits the submission.` });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to save your party presidential candidate." }); }
};

exports.updateCandidates = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });

    // The old direct candidate editor is intentionally disabled. Political-party
    // candidates belong to their respective party organization and must be created
    // or edited from that party's dashboard. This prevents Super Admin from
    // bypassing party ownership by adding a party candidate directly to an election.
    if (req.user?.platformRole === "super_admin") {
      return res.status(403).json({ success: false, code: "PARTY_CANDIDATE_PARTY_OWNED", message: "Political-party candidates are managed inside their respective political party dashboard. Super Admin cannot directly add or replace party candidates here." });
    }

    if (!(await canManageElection(req, election))) return res.status(403).json({ success: false, message: "You are not authorized to manage candidates for this election." });
    const candidates = Array.isArray(req.body?.candidates) ? req.body.candidates : [];
    if (!candidates.length) return res.status(400).json({ success: false, message: "At least one candidate is required." });
    if (election.type === "Presidential") return res.status(403).json({ success: false, code: "PRESIDENTIAL_PARTY_OWNED", message: "Presidential party candidates are managed by their respective political parties. Independent presidential registration is handled through the personal candidate registration flow." });
    return res.status(403).json({ success: false, message: "Direct election candidate editing is disabled. Candidate ownership is managed by the appropriate organization." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to save candidates." }); }
};
