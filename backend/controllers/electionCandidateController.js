const Election = require("../models/Election");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");

const MAX_PHOTO_LENGTH = 3 * 1024 * 1024;

async function canManageElection(req, election) {
  if (req.user?.platformRole === "super_admin") return true;
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

async function normalizeParticipants(election, candidates) {
  const parties = (election.parties || []).filter((party) => String(party.name || "").trim().toLowerCase() !== "independent");
  const partyById = new Map(parties.map((party) => [String(party.partyId || ""), party]));
  const partyByName = new Map(parties.map((party) => [String(party.name || "").trim().toLowerCase(), party]));

  return (Array.isArray(candidates) ? candidates : []).map((candidate) => {
    const requestedParty = String(candidate.party || "").trim();
    const party = (candidate.partyId && partyById.get(String(candidate.partyId))) || partyByName.get(requestedParty.toLowerCase());
    const independent = candidate.partyId === null || candidate.partyId === undefined || !requestedParty || requestedParty.toLowerCase() === "independent";
    const position = String(candidate.position || "president").trim().toLowerCase();
    if (!["president", "parliamentary", "local"].includes(position)) throw new Error(`Invalid candidate position for ${candidate.name || "candidate"}.`);
    const photo = String(candidate.profilePictureUrl || "").trim();
    if (photo.length > MAX_PHOTO_LENGTH) throw new Error("Candidate photo is too large. Please use a smaller image.");

    return {
      name: String(candidate.name || "").trim(),
      partyId: independent ? null : party?.partyId || null,
      party: independent ? "Independent" : party?.name || requestedParty,
      partyLogoUrl: independent ? "" : party?.logoUrl || String(candidate.partyLogoUrl || "").trim(),
      profilePictureUrl: photo,
      constituencyId: candidate.constituencyId || null,
      position,
      ballotNumber: Number.isInteger(Number(candidate.ballotNumber)) && Number(candidate.ballotNumber) > 0 ? Number(candidate.ballotNumber) : null,
    };
  }).filter((candidate) => candidate.name);
}

function participatingParty(election, partyId) {
  return (election.parties || []).find((party) => String(party.partyId || "") === String(partyId || ""));
}

function validatePresidential(election, candidates) {
  if (election.type !== "Presidential") return;
  const presidential = candidates.filter((candidate) => candidate.position === "president");
  const parties = (election.parties || []).filter((party) => String(party.name || "").trim().toLowerCase() !== "independent");
  const allowed = new Set(parties.map((party) => String(party.partyId || party.name).toLowerCase()));
  const assigned = new Set();
  let independent = 0;

  for (const candidate of presidential) {
    if (!candidate.partyId) {
      independent += 1;
      if (independent > 1) throw new Error("Only one Independent presidential candidate is allowed.");
      continue;
    }
    const key = String(candidate.partyId || candidate.party).toLowerCase();
    if (!allowed.has(key)) throw new Error(`Presidential candidate ${candidate.name} is assigned to a party that is not participating in this election.`);
    if (assigned.has(key)) throw new Error(`Each participating political party can have only one presidential candidate. Duplicate: ${candidate.party}.`);
    assigned.add(key);
  }

  const missing = parties.filter((party) => !assigned.has(String(party.partyId || party.name).toLowerCase()));
  if (missing.length) throw new Error(`Every participating political party must have a presidential candidate. Missing: ${missing.map((party) => party.name).join(", ")}.`);
  if (independent !== 1) throw new Error("The Independent presidential candidate must also be added.");
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
    return res.json({ success: true, election: { id: election._id, name: election.name, year: election.year, type: election.type }, party: { id: membership.organizationId, name: party.name || organization?.politicalPartyName || organization?.name, logoUrl: party.logoUrl || organization?.logo || "" }, candidate: candidate || null });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to load your party candidate." });
  }
};

exports.submitMyPartyCandidate = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (election.type !== "Presidential") return res.status(400).json({ success: false, message: "This election does not have a presidential ballot." });
    const membership = await getPartyMembership(req);
    if (!membership) return res.status(403).json({ success: false, message: "Only an approved national political party administrator can submit a party presidential candidate." });
    const party = participatingParty(election, membership.organizationId);
    if (!party) return res.status(403).json({ success: false, message: "Your political party is not a participating party in this election." });

    const name = String(req.body?.name || "").trim();
    const profilePictureUrl = String(req.body?.profilePictureUrl || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Candidate full name is required." });
    if (profilePictureUrl.length > MAX_PHOTO_LENGTH) return res.status(400).json({ success: false, message: "Candidate photo is too large. Please use a smaller image." });

    const candidates = (election.candidates || []).filter((candidate) => !(candidate.position === "president" && String(candidate.partyId || "") === String(membership.organizationId)));
    const candidate = {
      name,
      partyId: membership.organizationId,
      party: party.name,
      partyLogoUrl: party.logoUrl || "",
      profilePictureUrl,
      constituencyId: null,
      position: "president",
      ballotNumber: null,
    };
    candidates.push(candidate);
    election.candidates = candidates;
    await election.save();
    return res.json({ success: true, candidate, message: `${party.name} presidential candidate saved permanently until your party edits the submission.` });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to save your party presidential candidate." });
  }
};

exports.updateCandidates = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ success: false, message: "Election not found." });
    if (!(await canManageElection(req, election))) return res.status(403).json({ success: false, message: "You are not authorized to manage candidates for this election." });

    const candidates = await normalizeParticipants(election, req.body?.candidates);
    if (!candidates.length) return res.status(400).json({ success: false, message: "At least one candidate is required." });

    if (election.type === "Presidential") {
      if (candidates.some((candidate) => candidate.position !== "president")) {
        return res.status(400).json({ success: false, message: "A Presidential election can only contain presidential candidates in the presidential ballot." });
      }
      validatePresidential(election, candidates);
    }

    election.candidates = candidates;
    await election.save();
    return res.json({ success: true, election, message: "Candidate positions, party assignments, photos and ballot order saved permanently." });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Unable to save candidates." });
  }
};
