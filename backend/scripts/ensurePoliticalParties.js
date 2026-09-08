require("dotenv").config();

const mongoose = require("mongoose");
const Organization = require("../models/Organization");

const PERMANENT_POLITICAL_PARTIES = [
  "NPP",
  "NDC",
  "CPP",
  "LPG",
  "GUM",
  "PNC",
  "PPP",
  "The Base Party",
  "UP (Movement for Change)",
  "The New Force",
  "Independent",
];

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured.");
  await mongoose.connect(process.env.MONGODB_URI);

  let created = 0;
  for (const name of PERMANENT_POLITICAL_PARTIES) {
    const slug = slugify(name);
    const existing = await Organization.findOne({
      organizationType: "political_party",
      $or: [{ name }, { politicalPartyName: name }],
    });

    if (existing) {
      if (existing.organizationStatus !== "approved" || existing.isPermanentParty !== true) {
        await Organization.updateOne(
          { _id: existing._id },
          { $set: { name, politicalPartyName: name, isPermanentParty: true, isNewPartyRequest: false, organizationStatus: "approved", approvedAt: existing.approvedAt || new Date() } }
        );
      }
      continue;
    }

    await Organization.create({
      name,
      slug,
      organizationType: "political_party",
      politicalPartyName: name,
      isPermanentParty: true,
      isNewPartyRequest: false,
      organizationStatus: "approved",
      approvedAt: new Date(),
      approvedBy: null,
      description: name === "Independent" ? "Independent presidential candidates and election participants." : "Permanent PoliSync political party registry entry.",
    });
    created++;
  }

  console.log(`Political party registry ready. ${created} permanent entries created; ${PERMANENT_POLITICAL_PARTIES.length} permanent entries verified.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Political party bootstrap failed:", error.message || error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
