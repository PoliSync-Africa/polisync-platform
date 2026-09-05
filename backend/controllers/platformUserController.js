const User = require("../models/User");
const OrganizationMembership = require("../models/OrganizationMembership");

const ROLE_VALUES = [
  "national_party_admin",
  "regional_party_admin",
  "constituency_admin",
  "polling_station_agent",
  "national_observer_admin",
  "regional_observer_admin",
  "constituency_observer_admin",
  "observer_polling_station_agent",
  "presidential_candidate",
  "parliamentary_candidate",
  "individual_researcher",
  "research_institution_admin",
  "researcher",
  "organization_member",
];

const ACCOUNT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "suspended",
  "deactivated",
];

function serializeUser(user, membership) {
  const isSuperAdmin = user.platformRole === "super_admin";
  const accountStatus = user.accountStatus || "pending";

  return {
    id: user._id.toString(),
    name:
      user.displayName ||
      [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") ||
      user.username,
    email: user.email,
    role: isSuperAdmin ? "super_admin" : membership?.role || "organization_member",
    organization: isSuperAdmin
      ? "POLISYNC AFRICA"
      : membership?.organizationId?.name ||
        membership?.organizationId?.politicalPartyName ||
        "No organization",
    status: accountStatus === "approved" ? "active" : accountStatus,
    accountStatus,
    verification:
      user.verification?.isVerified && user.verification?.status === "approved"
        ? "verified"
        : "unverified",
    lastSeen: user.lastSeenAt || user.lastLoginAt || null,
    isOnline: Boolean(user.isOnline),
    membershipId: membership?._id?.toString() || null,
    membershipStatus: membership?.status || null,
  };
}

exports.listPlatformUsers = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "all").trim();

    const query = {};

    if (status !== "all") {
      const requestedStatus = status === "active" ? "approved" : status;
      if (!ACCOUNT_STATUSES.includes(requestedStatus)) {
        return res.status(400).json({ success: false, message: "Invalid account status filter." });
      }
      query.accountStatus = requestedStatus;
    }

    if (search) {
      const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { firstName: pattern },
        { middleName: pattern },
        { lastName: pattern },
        { displayName: pattern },
        { username: pattern },
        { email: pattern },
        { phone: pattern },
      ];
    }

    const users = await User.find(query)
      .select("_id platformRole displayName username firstName middleName lastName email accountStatus verification lastSeenAt lastLoginAt isOnline joinedAt")
      .sort({ joinedAt: -1 })
      .lean();

    const userIds = users.map((user) => user._id);
    const memberships = userIds.length
      ? await OrganizationMembership.find({
          userId: { $in: userIds },
          status: { $in: ["approved", "pending"] },
        })
          .populate("organizationId", "name politicalPartyName organizationType")
          .sort({ status: 1, createdAt: 1 })
          .lean()
      : [];

    const membershipByUser = new Map();
    for (const membership of memberships) {
      if (!membershipByUser.has(membership.userId.toString())) {
        membershipByUser.set(membership.userId.toString(), membership);
      }
    }

    const data = users.map((user) =>
      serializeUser(user, membershipByUser.get(user._id.toString()))
    );

    return res.json({
      success: true,
      users: data,
      total: data.length,
    });
  } catch (error) {
    console.error("Platform user list error:", error);
    return res.status(500).json({ success: false, message: "Unable to load platform users." });
  }
};

exports.updatePlatformUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus, verification, role } = req.body || {};

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    if (accountStatus !== undefined) {
      const nextStatus = accountStatus === "active" ? "approved" : accountStatus;
      if (!ACCOUNT_STATUSES.includes(nextStatus)) {
        return res.status(400).json({ success: false, message: "Invalid account status." });
      }

      user.accountStatus = nextStatus;
      if (nextStatus === "approved") {
        user.approvedAt = user.approvedAt || new Date();
        user.approvedBy = req.auth.userId;
        user.suspendedAt = null;
        user.suspensionReason = null;
      }
      if (nextStatus === "suspended") {
        user.suspendedAt = new Date();
      }
    }

    if (verification !== undefined) {
      if (verification !== "verified" && verification !== "unverified") {
        return res.status(400).json({ success: false, message: "Invalid verification value." });
      }

      if (verification === "verified") {
        user.verification.isVerified = true;
        user.verification.status = "approved";
        user.verification.reviewedAt = new Date();
        user.verification.reviewedBy = req.auth.userId;
      } else {
        user.verification.isVerified = false;
        user.verification.status = "revoked";
        user.verification.reviewedAt = new Date();
        user.verification.reviewedBy = req.auth.userId;
      }
    }

    if (role !== undefined) {
      if (user.platformRole === "super_admin") {
        return res.status(400).json({ success: false, message: "Super Admin platform role cannot be changed here." });
      }
      if (!ROLE_VALUES.includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid organization role." });
      }

      const membership = await OrganizationMembership.findOne({
        userId: user._id,
        status: { $in: ["approved", "pending"] },
      }).sort({ status: 1, createdAt: 1 });

      if (!membership) {
        return res.status(400).json({ success: false, message: "This user has no active or pending organization membership." });
      }

      membership.role = role;
      await membership.save();
    }

    await user.save();

    const membership = user.platformRole === "super_admin"
      ? null
      : await OrganizationMembership.findOne({
          userId: user._id,
          status: { $in: ["approved", "pending"] },
        })
          .populate("organizationId", "name politicalPartyName organizationType")
          .sort({ status: 1, createdAt: 1 })
          .lean();

    return res.json({
      success: true,
      user: serializeUser(user.toObject(), membership),
    });
  } catch (error) {
    console.error("Platform user update error:", error);
    return res.status(500).json({ success: false, message: "Unable to update platform user." });
  }
};
