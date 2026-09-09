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

const DEFAULT_PARTY_LOGOS = {
  NPP: "/parties/npp.svg",
  NDC: "/parties/ndc.svg",
  CPP: "/parties/cpp.svg",
  GUM: "/parties/gum.svg",
};

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function ensurePoliticalParties(Organization) {
  const now = new Date();
  const operations = PERMANENT_POLITICAL_PARTIES.map((name) => ({
    updateOne: {
      filter: {
        organizationType: "political_party",
        $or: [{ name }, { politicalPartyName: name }],
      },
      update: {
        $set: {
          name,
          politicalPartyName: name,
          isPermanentParty: true,
          isNewPartyRequest: false,
          organizationStatus: "approved",
          approvedAt: now,
          ...(DEFAULT_PARTY_LOGOS[name] ? { logo: DEFAULT_PARTY_LOGOS[name] } : {}),
        },
        $setOnInsert: {
          slug: slugify(name),
          description: name === "Independent" ? "Independent presidential candidates and election participants." : "Permanent PoliSync political party registry entry.",
          approvedBy: null,
        },
      },
      upsert: true,
    },
  }));

  const result = await Organization.bulkWrite(operations, { ordered: false });
  const created = result.upsertedCount || 0;
  console.log(`Political party registry ready. ${created} permanent entries created; ${PERMANENT_POLITICAL_PARTIES.length} permanent entries verified.`);
  return result;
}

module.exports = { PERMANENT_POLITICAL_PARTIES, ensurePoliticalParties };
