const mongoose = require("mongoose");
require("dotenv").config();
const User = require("../models/User");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured.");
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.updateMany(
    { platformRole: "user", accountStatus: "pending" },
    { $set: { accountStatus: "approved", approvedAt: new Date(), approvedBy: null } }
  );

  console.log(`Approved ${result.modifiedCount || 0} existing personal account(s).`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Personal account migration failed:", error);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
