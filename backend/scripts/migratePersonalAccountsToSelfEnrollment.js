require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const PersonalWorkspaceProfile = require("../models/PersonalWorkspaceProfile");
const ResearchResource = require("../models/ResearchResource");

const JOURNALIST_PERMISSIONS = [
  "view_public_data",
  "explore_electoral_geography",
  "view_results",
  "view_candidates",
  "source_verification",
  "fact_check",
  "press_calendar",
  "newsroom",
  "editorial_calendar",
  "use_ai_analyzer",
];

async function migrate() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured.");
  await mongoose.connect(process.env.MONGO_URI);

  // Existing personal profiles that were created under the old model are
  // migrated to the current three-role model. Media House becomes Journalist.
  const mediaHouseResult = await PersonalWorkspaceProfile.updateMany(
    { purpose: "media_house" },
    {
      $set: {
        purpose: "journalist",
        accessProfile: "journalist_read",
        permissions: JOURNALIST_PERMISSIONS,
      },
    }
  );

  // Personal accounts are self-created and do not require Super Admin approval.
  // Only users with a PersonalWorkspaceProfile are targeted so organization-only
  // accounts are not accidentally approved by this migration.
  const personalUsers = await PersonalWorkspaceProfile.distinct("userId");
  const approvalResult = await User.updateMany(
    {
      _id: { $in: personalUsers },
      platformRole: "user",
      accountStatus: "pending",
    },
    { $set: { accountStatus: "approved" } }
  );

  // Remove the legacy audience from resource documents and make those resources
  // available to journalists instead.
  const resourceResult = await ResearchResource.updateMany(
    { audience: "media_house" },
    [
      {
        $set: {
          audience: {
            $setUnion: [
              {
                $filter: {
                  input: "$audience",
                  as: "audience",
                  cond: { $ne: ["$$audience", "media_house"] },
                },
              },
              ["journalist"],
            ],
          },
          access: {
            $cond: [{ $eq: ["$access", "media"] }, "journalist", "$access"],
          },
        },
      },
    ]
  );

  console.log({
    mediaHouseProfilesConverted: mediaHouseResult.modifiedCount,
    personalAccountsApproved: approvalResult.modifiedCount,
    resourceDocumentsUpdated: resourceResult.modifiedCount,
  });
}

migrate()
  .catch((error) => {
    console.error("Personal account migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
