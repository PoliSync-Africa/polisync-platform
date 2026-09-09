const mongoose = require("mongoose");

const PERMANENT_POLITICAL_PARTIES = ["NPP","NDC","CPP","LPG","GUM","PNC","PPP","The Base Party","UP (Movement for Change)","The New Force","Independent"];

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    organizationType: { type: String, required: true, enum: ["political_party","observer_organization","parliamentary_candidate","presidential_candidate","research"] },
    creatorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    researchType: { type: String, enum: ["individual_researcher","research_institution",null], default: null },
    politicalPartyName: { type: String, default: null, trim: true },
    isPermanentParty: { type: Boolean, default: false },
    isNewPartyRequest: { type: Boolean, default: false },
    partyElectionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Election" }],
    partyAdminRequestUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    partyAdminRequestStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
    partyAdminRequestElectionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Election" }],
    partyAdminRequestAt: { type: Date, default: null },
    candidate: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      username: { type: String, default: null, trim: true },
      fullName: { type: String, default: null, trim: true },
      profilePhoto: { type: String, default: null },
      registrationSource: { type: String, enum: ["polisync_user","official_source","manual",null], default: null },
      registrationReference: { type: String, default: null, trim: true },
      registrationStatus: { type: String, enum: ["not_verified","pending","verified","rejected"], default: "not_verified" },
      biography: { type: String, default: "", trim: true },
      campaignProfile: { type: String, default: "", trim: true },
    },
    candidateParty: { type: String, default: null, trim: true },
    candidateIsIndependent: { type: Boolean, default: false },
    electionId: { type: mongoose.Schema.Types.ObjectId, ref: "Election", default: null },
    region: { type: String, default: null, trim: true },
    constituency: { type: String, default: null, trim: true },
    email: { type: String, lowercase: true, trim: true, default: null },
    phone: { type: String, trim: true, default: null, match: /^\+233\d{9}$/ },
    website: { type: String, default: null, trim: true },
    logo: { type: String, default: null },
    description: { type: String, default: "", trim: true },
    organizationStatus: { type: String, required: true, enum: ["pending","approved","rejected","suspended","deactivated"], default: "pending" },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    suspendedAt: { type: Date, default: null },
    suspensionReason: { type: String, default: null, trim: true },
    joinedAt: { type: Date, default: Date.now, immutable: true },
    settings: { timezone: { type: String, default: "Africa/Accra" }, defaultLanguage: { type: String, default: "en" } },
  },
  { timestamps: true }
);
organizationSchema.pre("save", function (next) { if (this.slug) this.slug = this.slug.toLowerCase().trim(); next(); });
const Organization = mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
module.exports = Organization;
module.exports.PERMANENT_POLITICAL_PARTIES = PERMANENT_POLITICAL_PARTIES;
