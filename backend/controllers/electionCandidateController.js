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
