const mongoose = require("mongoose");

const User = require("../models/User");
const Organization = require("../models/Organization");
const OrganizationMembership = require("../models/OrganizationMembership");

const getAuthenticatedUserId = (req) =>
  req.user?._id || req.user?.id || req.auth?.id || null;

const isCertifiedPartyAdmin = (user) => {
  return Boolean(
    user &&
      user.platformRole !== "super_admin" &&
      user.accountStatus === "approved" &&
      user.verification?.isVerified === true &&
      user.verification?.status === "approved" &&
      user.verification?.verificationType === "political_party"
  );
};

// Creates a political-party organization and automatically gives
// the certified creator the national_party_admin membership.
// There is NO separate political-party dashboard and NO separate
// national-admin dashboard. The /party workspace is the single
// national party command center.
exports.createPoliticalParty = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const creator = await User.findById(userId);

    if (!creator) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user was not found.",
      });
    }

    if (!isCertifiedPartyAdmin(creator)) {
      return res.status(403).json({
        success: false,
        message:
          "Only an approved and verified political-party administrator can create a political party.",
      });
    }

    const {
      name,
      slug,
      politicalPartyName,
      email,
      phone,
      website,
      logo,
      description,
    } = req.body || {};

    const normalizedName = String(name || politicalPartyName || "").trim();
    const normalizedSlug = String(
      slug || normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    )
      .trim()
      .replace(/^-+|-+$/g, "");

    if (!normalizedName || !normalizedSlug) {
      return res.status(400).json({
        success: false,
        message: "Political party name is required.",
      });
    }

    const existing = await Organization.findOne({
      $or: [
        { slug: normalizedSlug.toLowerCase() },
        {
          organizationType: "political_party",
          politicalPartyName: normalizedName,
        },
      ],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This political party already exists in PoliSync Africa.",
        organizationId: existing._id,
      });
    }

    session.startTransaction();

    const organization = new Organization({
      name: normalizedName,
      slug: normalizedSlug.toLowerCase(),
      organizationType: "political_party",
      politicalPartyName: normalizedName,
      isPermanentParty: Boolean(
        Organization.PERMANENT_POLITICAL_PARTIES?.includes(normalizedName)
      ),
      isNewPartyRequest: !Organization.PERMANENT_POLITICAL_PARTIES?.includes(
        normalizedName
      ),
      email: email || creator.email,
      phone: phone || creator.phone,
      website: website || null,
      logo: logo || null,
      description: description || "",
      organizationStatus: "approved",
      approvedAt: new Date(),
      approvedBy: creator._id,
    });

    await organization.save({ session });

    const membership = new OrganizationMembership({
      userId: creator._id,
      organizationId: organization._id,
      role: "national_party_admin",
      level: "national",
      status: "approved",
      approvedAt: new Date(),
      approvedBy: creator._id,
      joinedAt: new Date(),
    });

    await membership.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      message:
        "Political party created successfully. The certified creator is now the National Party Admin and can use the single Party Dashboard.",
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        organizationType: organization.organizationType,
        organizationStatus: organization.organizationStatus,
      },
      membership: {
        id: membership._id,
        role: membership.role,
        level: membership.level,
        status: membership.status,
      },
      dashboard: "/party",
    });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch {}

    console.error("Create political party error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create political party.",
    });
  } finally {
    await session.endSession();
  }
};
