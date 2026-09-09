const Election = require("../models/Election");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");

const MAX_PHOTO_LENGTH = 3 * 1024 * 1024;
const MAX_LOGO_LENGTH = 2 * 1024 * 1024;

async function getPartyMembership(req) {
  return OrganizationMembership.findOne({ userId: req.user?._id, role: "national_party_admin", status: "approved", organizationType: "political_party" }).lean();
}
function participatingParty(election, partyId) { return (election.parties || []).find((party) => String(party.partyId || "") === String(partyId || "")); }
function candidateName(firstName, surname, fallback = "") { return `${String(firstName || "").trim()} ${String(surname || "").trim()}`.trim() || String(fallback || "").trim(); }

function normalizePresidentialCandidates(candidates, election) {
  const participants = election.parties || [];
  const byId = new Map(participants.filter((p) => p.partyId).map((p) => [String(p.partyId), p]));
  const byName = new Map(participants.map((p) => [String(p.name || "").trim().toLowerCase(), p]));
  const normalized = [], assigned = new Set();
  for (const raw of Array.isArray(candidates) ? candidates : []) {
    const firstName = String(raw?.firstName || "").trim(), surname = String(raw?.surname || "").trim();
    const name = candidateName(firstName, surname, raw?.name);
    if (!name) continue;
    const requestedParty = String(raw?.party || "").trim();
    const party = (raw?.partyId && byId.get(String(raw.partyId))) || byName.get(requestedParty.toLowerCase());
    if (!party) throw new Error(`Candidate ${name} is assigned to a participant that is not participating in this election.`);
    if (!firstName || !surname) throw new Error(`Candidate for ${party.name} must have a first name and surname.`);
    const candidate = { firstName, surname, name, partyId: party.partyId || null, party: party.name, partyLogoUrl: String(raw?.partyLogoUrl || "").trim() || party.logoUrl || "", profilePictureUrl: String(raw?.profilePictureUrl || "").trim(), constituencyId: null, position: "president", ballotNumber: null };
    if (candidate.profilePictureUrl.length > MAX_PHOTO_LENGTH) throw new Error(`Profile picture for ${name} is too large. Use an image up to 3 MB.`);
    if (candidate.partyLogoUrl.length > MAX_LOGO_LENGTH) throw new Error(`Participant logo for ${candidate.party} is too large. Use an image up to 2 MB.`);
    const key = String(party.partyId || party.name).toLowerCase();
    if (assigned.has(key)) throw new Error(`Each participating party/participant can have only one presidential candidate. Duplicate found for ${party.name}.`);
    assigned.add(key); normalized.push(candidate);
  }
  const missing = participants.filter((p) => !assigned.has(String(p.partyId || p.name).toLowerCase()));
  if (missing.length) throw new Error(`Every participating party/participant must have a presidential candidate. Missing: ${missing.map((p) => p.name).join(", ")}.`);
  normalized.forEach((candidate, index) => { candidate.ballotNumber = index + 1; });
  return normalized;
}

exports.getMyPartyCandidate = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id).lean();
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (election.type !== "Presidential") return res.status(400).json({ success: false, message: "This election does not have a presidential ballot." });
    const membership = await getPartyMembership(req); if (!membership) return res.status(403).json({ success: false, message: "Only an approved national political party administrator can submit a party presidential candidate." });
    const party = participatingParty(election, membership.organizationId); if (!party) return res.status(403).json({ success: false, message: "Your political party is not a participating party in this election." });
    const candidate = (election.candidates || []).find((item) => item.position === "president" && String(item.partyId || "") === String(membership.organizationId));
    const organization = await Organization.findById(membership.organizationId).select("_id name politicalPartyName logo").lean();
    return res.json({ success: true, readOnly: election.status === "Closed", election: { id: election._id, name: election.name, year: election.year, type: election.type, status: election.status }, party: { id: membership.organizationId, name: party.name || organization?.politicalPartyName || organization?.name, logoUrl: party.logoUrl || organization?.logo || "" }, candidate: candidate || null });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to load your party candidate." }); }
};

exports.submitMyPartyCandidate = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (election.type !== "Presidential") return res.status(400).json({ success: false, message: "This election does not have a presidential ballot." });
    if (election.status !== "Active") return res.status(403).json({ success: false, code: "ELECTION_READ_ONLY", message: "This election is not accepting party candidate changes." });
    const membership = await getPartyMembership(req); if (!membership) return res.status(403).json({ success: false, message: "Only an approved national political party administrator can submit a party presidential candidate." });
    const party = participatingParty(election, membership.organizationId); if (!party) return res.status(403).json({ success: false, message: "Your political party is not a participating party in this election." });
    const firstName = String(req.body?.firstName || "").trim(), surname = String(req.body?.surname || "").trim(), name = candidateName(firstName, surname, req.body?.name), profilePictureUrl = String(req.body?.profilePictureUrl || "").trim();
    if (!firstName || !surname) return res.status(400).json({ success: false, message: "Candidate first name and surname are required." });
    if (profilePictureUrl.length > MAX_PHOTO_LENGTH) return res.status(400).json({ success: false, message: "Candidate photo is too large. Please use a smaller image." });
    const candidates = (election.candidates || []).filter((candidate) => !(candidate.position === "president" && String(candidate.partyId || "") === String(membership.organizationId)));
    const organization = await Organization.findById(membership.organizationId).select("logo politicalPartyName name").lean();
    candidates.push({ firstName, surname, name, partyId: membership.organizationId, party: party.name, partyLogoUrl: organization?.logo || party.logoUrl || "", profilePictureUrl, constituencyId: null, position: "president", ballotNumber: null });
    election.candidates = candidates; await election.save();
    return res.json({ success: true, candidate: candidates[candidates.length - 1], message: `${party.name} presidential candidate saved.` });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to save your party presidential candidate." }); }
};

exports.updateCandidates = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id); if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (req.user?.platformRole !== "super_admin") return res.status(403).json({ success: false, code: "SUPER_ADMIN_ONLY", message: "Only the Super Admin can maintain the broader official election candidate list." });
    if (election.type !== "Presidential") return res.status(400).json({ success: false, message: "This election candidate manager is for presidential elections." });
    if (election.status === "Closed") return res.status(403).json({ success: false, code: "ELECTION_READ_ONLY", message: "Closed elections are read-only." });
    if (!Array.isArray(req.body?.candidates)) return res.status(400).json({ success: false, message: "Candidate list is required." });
    const candidates = normalizePresidentialCandidates(req.body.candidates, election);
    const candidateByParty = new Map(candidates.map((candidate) => [String(candidate.partyId || candidate.party || "").toLowerCase(), candidate]));
    election.parties = (election.parties || []).map((participant) => { const key = String(participant.partyId || participant.name || "").toLowerCase(); const candidate = candidateByParty.get(key); if (!candidate?.partyLogoUrl) return participant; const base = typeof participant.toObject === "function" ? participant.toObject() : participant; return { ...base, logoUrl: candidate.partyLogoUrl }; });
    election.candidates = candidates; await election.save();
    return res.json({ success: true, election, candidates, message: "Official presidential candidates saved. Political parties and Independent are treated as equal election participants." });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to save the official presidential candidates." }); }
};
