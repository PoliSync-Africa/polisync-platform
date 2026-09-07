const crypto = require("crypto");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");
const Invitation = require("../models/Invitation");
const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

const ROLES = {
  national: "national_party_admin",
  regional: "regional_party_admin",
  constituency: "constituency_admin",
  polling_station: "polling_station_agent",
};
const LEVELS = Object.keys(ROLES);
const getUserId = (req) => req.user?._id || req.user?.id || req.auth?.id || null;
const validId = (v) => v && mongoose.Types.ObjectId.isValid(v);
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const makeToken = () => crypto.randomBytes(32).toString("base64url");

async function getPartyContext(userId) {
  const memberships = await OrganizationMembership.find({ userId, status: "approved" }).lean();
  const membership = memberships.find((m) => ["national_party_admin", "regional_party_admin", "constituency_admin", "polling_station_agent"].includes(m.role));
  if (!membership) return null;
  const organization = await Organization.findById(membership.organizationId).lean();
  if (!organization || organization.organizationType !== "political_party" || organization.organizationStatus !== "approved") return null;
  return { organization, membership };
}

function canDeploy(membership, target) {
  const source = membership.level;
  if (source === "national") return true;
  if (source === "regional") return ["constituency", "polling_station"].includes(target.level) && String(target.regionId || "") === String(membership.regionId || "");
  if (source === "constituency") return target.level === "polling_station" && String(target.constituencyId || "") === String(membership.constituencyId || "");
  return false;
}

async function validateScope(level, regionId, constituencyId, pollingStationId) {
  if (!LEVELS.includes(level)) throw Object.assign(new Error("Unsupported deployment level."), { status: 400 });
  if (level === "national") return { regionId: null, constituencyId: null, pollingStationId: null };
  if (!validId(regionId) && level !== "polling_station") throw Object.assign(new Error("A valid region is required."), { status: 400 });
  if (level === "regional") {
    if (!(await Region.exists({ _id: regionId, isActive: { $ne: false } }))) throw Object.assign(new Error("Region not found."), { status: 404 });
    return { regionId, constituencyId: null, pollingStationId: null };
  }
  if (!validId(constituencyId)) throw Object.assign(new Error("A valid constituency is required."), { status: 400 });
  const constituency = await Constituency.findOne({ _id: constituencyId, isActive: { $ne: false } }).lean();
  if (!constituency) throw Object.assign(new Error("Constituency not found."), { status: 404 });
  if (regionId && String(constituency.regionId) !== String(regionId)) throw Object.assign(new Error("Constituency is outside the selected region."), { status: 400 });
  if (level === "constituency") return { regionId: constituency.regionId, constituencyId, pollingStationId: null };
  if (!validId(pollingStationId)) throw Object.assign(new Error("A valid polling station is required."), { status: 400 });
  const station = await PollingStation.findOne({ _id: pollingStationId, isActive: { $ne: false } }).lean();
  if (!station) throw Object.assign(new Error("Polling station not found."), { status: 404 });
  if (String(station.constituencyId) !== String(constituencyId)) throw Object.assign(new Error("Polling station is outside the selected constituency."), { status: 400 });
  return { regionId: station.regionId, constituencyId: station.constituencyId, pollingStationId: station._id };
}

exports.createInvitation = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required." });
    const context = await getPartyContext(userId);
    if (!context) return res.status(403).json({ success: false, message: "Approved political-party administration access is required." });
    const { level, regionId, constituencyId, pollingStationId, expiresInDays = 7, maxUses = 1 } = req.body || {};
    const scope = await validateScope(level, regionId, constituencyId, pollingStationId);
    const target = { level, ...scope };
    if (!canDeploy(context.membership, target)) return res.status(403).json({ success: false, message: "You cannot deploy invitations outside your organizational scope." });
    const days = Math.min(Math.max(Number(expiresInDays) || 7, 1), 30);
    const uses = Math.min(Math.max(Number(maxUses) || 1, 1), 1000);
    const token = makeToken();
    const invitation = await Invitation.create({ organizationId: context.organization._id, createdBy: userId, tokenHash: hashToken(token), role: ROLES[level], level, ...scope, maxUses: uses, expiresAt: new Date(Date.now() + days * 86400000) });
    const base = String(process.env.FRONTEND_URL || "https://polisync-app.onrender.com").replace(/\/$/, "");
    const inviteUrl = `${base}/invite/${encodeURIComponent(token)}`;
    const qrCode = await QRCode.toDataURL(inviteUrl, { errorCorrectionLevel: "M", margin: 2, width: 360 });
    return res.status(201).json({ success: true, invitation: { id: invitation._id, url: inviteUrl, qrCode, level, role: ROLES[level], regionId: scope.regionId, constituencyId: scope.constituencyId, pollingStationId: scope.pollingStationId, expiresAt: invitation.expiresAt, maxUses: uses, status: "active" } });
  } catch (error) {
    console.error("Create party deployment invitation error:", error);
    return res.status(error.status || 500).json({ success: false, message: error.status ? error.message : "Unable to create invitation." });
  }
};

exports.listInvitations = async (req, res) => {
  try {
    const userId = getUserId(req); const context = await getPartyContext(userId);
    if (!context) return res.status(403).json({ success: false, message: "Approved political-party administration access is required." });
    const invitations = await Invitation.find({ organizationId: context.organization._id }).sort({ createdAt: -1 }).limit(200).lean();
    const now = new Date();
    const items = invitations.map((i) => ({ ...i, status: i.revokedAt ? "revoked" : i.expiresAt <= now ? "expired" : i.uses >= i.maxUses ? "used" : "active" }));
    return res.json({ success: true, invitations: items });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to load invitations." }); }
};

exports.revokeInvitation = async (req, res) => {
  try {
    const userId = getUserId(req); const context = await getPartyContext(userId);
    if (!context) return res.status(403).json({ success: false, message: "Approved political-party administration access is required." });
    const invitation = await Invitation.findOne({ _id: req.params.id, organizationId: context.organization._id });
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found." });
    invitation.revokedAt = new Date(); await invitation.save();
    return res.json({ success: true, message: "Invitation revoked." });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to revoke invitation." }); }
};

exports.getInvitation = async (req, res) => {
  const invitation = await Invitation.findOne({ tokenHash: hashToken(req.params.token) }).populate("organizationId", "name logo politicalPartyName").lean();
  if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found or invalid." });
  if (invitation.revokedAt || invitation.expiresAt <= new Date() || invitation.uses >= invitation.maxUses) return res.status(410).json({ success: false, message: "This invitation is no longer active." });
  return res.json({ success: true, invitation: { organization: invitation.organizationId, level: invitation.level, role: invitation.role, regionId: invitation.regionId, constituencyId: invitation.constituencyId, pollingStationId: invitation.pollingStationId, expiresAt: invitation.expiresAt, remainingUses: invitation.maxUses - invitation.uses } });
};

exports.acceptInvitation = async (req, res) => {
  try {
    const userId = getUserId(req); if (!userId) return res.status(401).json({ success: false, message: "Sign in to accept this invitation." });
    const invitation = await Invitation.findOne({ tokenHash: hashToken(req.params.token) });
    if (!invitation) return res.status(404).json({ success: false, message: "Invitation not found or invalid." });
    if (invitation.revokedAt || invitation.expiresAt <= new Date() || invitation.uses >= invitation.maxUses) return res.status(410).json({ success: false, message: "This invitation is no longer active." });
    const context = await getPartyContext(userId);
    if (context && String(context.organization._id) !== String(invitation.organizationId)) return res.status(403).json({ success: false, message: "Your existing party organization does not match this invitation." });
    const existing = await OrganizationMembership.findOne({ userId, organizationId: invitation.organizationId, role: invitation.role, level: invitation.level, regionId: invitation.regionId, constituencyId: invitation.constituencyId, pollingStationId: invitation.pollingStationId, status: { $in: ["pending", "approved"] } });
    if (existing) return res.json({ success: true, message: "You already have this organization assignment.", membershipId: existing._id });
    const membership = await OrganizationMembership.create({ userId, organizationId: invitation.organizationId, role: invitation.role, level: invitation.level, regionId: invitation.regionId, constituencyId: invitation.constituencyId, pollingStationId: invitation.pollingStationId, status: "pending", invitationId: invitation._id, invitedAt: new Date() });
    invitation.uses += 1; invitation.acceptedAt = new Date(); invitation.lastAcceptedUserId = userId; await invitation.save();
    return res.status(201).json({ success: true, message: "Invitation accepted. Your organization assignment is pending approval.", membershipId: membership._id, status: "pending" });
  } catch (error) { console.error("Accept party invitation error:", error); return res.status(500).json({ success: false, message: "Unable to accept invitation." }); }
};
