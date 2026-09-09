const mongoose = require("mongoose");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");
const Election = require("../models/Election");
const Constituency = require("../models/Constituency");

const partyNameKey = (v) => String(v || "").trim().toLowerCase();

async function resolveParty(candidate) {
  if (candidate.candidateIsIndependent || partyNameKey(candidate.candidateParty) === "independent") return null;
  return Organization.findOne({
    organizationType: "political_party",
    organizationStatus: "approved",
    $or: [{ name: candidate.candidateParty }, { politicalPartyName: candidate.candidateParty }],
  }).select("_id name politicalPartyName logo").lean();
}

async function partyHasNationalAdmin(partyId) {
  return OrganizationMembership.exists({ organizationId: partyId, role: "national_party_admin", status: "approved" });
}

async function assertApprover({ actor, candidate }) {
  if (actor?.platformRole === "super_admin") return { mode: "super_admin", organizationId: null };
  const party = await resolveParty(candidate);
  if (!party) throw new Error("Only the Super Admin can approve an Independent candidate.");
  const membership = await OrganizationMembership.findOne({ userId: actor?._id, organizationId: party._id, role: "national_party_admin", status: "approved" }).lean();
  if (!membership) throw new Error("Only the political party's approved National Admin can approve this candidate.");
  return { mode: "party", organizationId: party._id };
}

async function synchronizeApprovedCandidate(candidate, approver) {
  if (!candidate.electionId || !mongoose.Types.ObjectId.isValid(candidate.electionId)) throw new Error("Candidate is not associated with a valid election.");
  const election = await Election.findOne({ _id: candidate.electionId, status: { $in: ["Active", "Closed"] } });
  if (!election) throw new Error("The associated election is no longer available for candidate synchronization.");
  const isPresidential = candidate.organizationType === "presidential_candidate";
  const expectedType = isPresidential ? "Presidential" : "Parliamentary";
  if (election.type !== expectedType) throw new Error(`Candidate cannot be synchronized into a ${election.type} election.`);

  let party = await resolveParty(candidate);
  if (party) {
    const participating = (election.parties || []).find((p) => String(p.partyId || "") === String(party._id) || partyNameKey(p.name) === partyNameKey(party.politicalPartyName || party.name));
    if (!participating) throw new Error("The candidate's political party is not participating in the associated election.");
  }

  let constituencyId = null;
  if (!isPresidential) {
    if (!candidate.region || !candidate.constituency) throw new Error("Parliamentary candidate requires a region and constituency.");
    const constituency = await Constituency.findOne({ name: candidate.constituency, isActive: true }).select("_id regionId name").lean();
    if (!constituency) throw new Error("The candidate's constituency could not be found in the electoral registry.");
    constituencyId = constituency._id;
  }

  const partyId = party?._id || null;
  const partyName = party?.politicalPartyName || party?.name || "Independent";
  const partyLogoUrl = party?.logo || "";
  const position = isPresidential ? "president" : "parliamentary";
  const nextCandidate = {
    name: candidate.candidate?.fullName || candidate.name,
    partyId,
    party: partyName,
    partyLogoUrl,
    profilePictureUrl: candidate.candidate?.profilePhoto || candidate.logo || "",
    constituencyId,
    position,
    ballotNumber: null,
  };

  const current = Array.isArray(election.candidates) ? election.candidates : [];
  let replacementIndex = -1;
  if (isPresidential) {
    replacementIndex = current.findIndex((c) => c.position === "president" && String(c.partyId || "") === String(partyId || "") && (!partyId || partyNameKey(c.party) === partyNameKey(partyName)));
    const duplicate = current.find((c) => c.position === "president" && String(c.partyId || "") === String(partyId || "") && String(c.name || "").trim().toLowerCase() !== String(nextCandidate.name || "").trim().toLowerCase());
    if (duplicate && replacementIndex < 0) throw new Error("This party already has a presidential candidate in this election.");
    if (!partyId) {
      replacementIndex = current.findIndex((c) => c.position === "president" && !c.partyId && partyNameKey(c.party) === "independent");
      const independentDuplicate = current.find((c) => c.position === "president" && !c.partyId && replacementIndex < 0);
      if (independentDuplicate) throw new Error("An Independent presidential candidate already exists in this election.");
    }
  } else {
    replacementIndex = current.findIndex((c) => c.position === "parliamentary" && String(c.partyId || "") === String(partyId || "") && String(c.constituencyId || "") === String(constituencyId || ""));
    if (replacementIndex < 0 && current.some((c) => c.position === "parliamentary" && String(c.partyId || "") === String(partyId || "") && String(c.constituencyId || "") === String(constituencyId || ""))) throw new Error("This party already has a parliamentary candidate for this constituency.");
  }
  if (replacementIndex >= 0) current[replacementIndex] = nextCandidate; else current.push(nextCandidate);
  if (isPresidential) {
    const presidents = current.filter((c) => c.position === "president");
    const seen = new Set();
    for (const c of presidents) { const key = c.partyId ? String(c.partyId) : "independent"; if (seen.has(key)) throw new Error("Each participating party can have only one presidential candidate."); seen.add(key); }
  }
  election.candidates = current;
  await election.save();
  return { election, candidate: nextCandidate, approverMode: approver.mode };
}

async function approveCandidate({ candidateId, actor }) {
  const candidate = await Organization.findOne({ _id: candidateId, organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] } });
  if (!candidate) throw new Error("Candidate registration not found.");
  if (candidate.organizationStatus === "approved" && candidate.candidate?.registrationStatus === "verified") throw new Error("This candidate is already approved.");
  if (candidate.organizationStatus !== "pending" && candidate.candidate?.registrationStatus !== "pending") throw new Error("This candidate is not awaiting approval.");
  const approver = await assertApprover({ actor, candidate });
  const synced = await synchronizeApprovedCandidate(candidate, approver);
  candidate.organizationStatus = "approved";
  candidate.approvedAt = new Date();
  candidate.approvedBy = actor._id;
  candidate.candidate.registrationStatus = "verified";
  await candidate.save();
  return { candidate, ...synced };
}

async function listPartyPendingCandidates(partyId) {
  const party = await Organization.findById(partyId).select("_id name politicalPartyName logo").lean();
  if (!party) throw new Error("Political party not found.");
  const candidates = await Organization.find({
    organizationType: { $in: ["presidential_candidate", "parliamentary_candidate"] },
    organizationStatus: "pending",
    candidate: { $exists: true },
    candidateParty: { $in: [party.name, party.politicalPartyName] },
  }).sort({ createdAt: -1 }).lean();
  return candidates;
}

module.exports = { approveCandidate, assertApprover, partyHasNationalAdmin, listPartyPendingCandidates, synchronizeApprovedCandidate };
