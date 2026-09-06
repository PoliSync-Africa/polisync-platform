const User = require("../models/User");
const Notification = require("../models/Notification");
const OrganizationMembership = require("../models/OrganizationMembership");

const ACTIVE_USER_FILTER = {
  platformRole: "user",
  accountStatus: "approved",
};

const getAudienceUserIds = async (audience) => {
  if (audience === "all" || audience === "personal") {
    return User.find(ACTIVE_USER_FILTER).select("_id").lean();
  }

  const roles = audience === "party"
    ? [
        "national_party_admin",
        "regional_party_admin",
        "constituency_admin",
        "polling_station_agent",
      ]
    : audience === "observer"
      ? [
          "national_observer_admin",
          "regional_observer_admin",
          "constituency_observer_admin",
          "observer_polling_station_agent",
        ]
      : null;

  const membershipFilter = {
    status: "approved",
    ...(roles ? { role: { $in: roles } } : {}),
  };

  const memberships = await OrganizationMembership.find(membershipFilter)
    .select("userId")
    .lean();

  const uniqueIds = [...new Set(memberships.map((row) => String(row.userId)))];
  if (!uniqueIds.length) return [];

  return User.find({
    ...ACTIVE_USER_FILTER,
    _id: { $in: uniqueIds },
  }).select("_id").lean();
};

const deliverAnnouncementNotifications = async (announcement) => {
  if (!announcement?._id) throw new Error("Announcement is required.");
  if (announcement.status !== "published") throw new Error("Only published announcements can be delivered.");

  const users = await getAudienceUserIds(announcement.audience || "all");
  if (!users.length) {
    return { matchedUsers: 0, notificationsCreated: 0, skippedExisting: 0 };
  }

  const userIds = users.map((user) => user._id);
  const existing = await Notification.find({
    type: "system",
    "metadata.announcementId": announcement._id,
    recipient: { $in: userIds },
  }).select("recipient").lean();

  const existingRecipients = new Set(existing.map((row) => String(row.recipient)));
  const title = announcement.isFeatureRelease
    ? `New PoliSync feature: ${announcement.featureName || announcement.title}`
    : announcement.title;
  const message = announcement.isFeatureRelease
    ? `${announcement.body}${announcement.actionUrl ? " Open PoliSync to try the new feature." : ""}`
    : announcement.body;

  const documents = users
    .filter((user) => !existingRecipients.has(String(user._id)))
    .map((user) => ({
      recipient: user._id,
      type: "system",
      channel: "in_app",
      title,
      message,
      status: "sent",
      read: false,
      metadata: {
        announcementId: announcement._id,
        featureRelease: Boolean(announcement.isFeatureRelease),
        featureName: announcement.featureName || "",
        actionUrl: announcement.actionUrl || "",
      },
      createdBy: announcement.createdBy || null,
    }));

  let notificationsCreated = 0;
  for (let index = 0; index < documents.length; index += 500) {
    const chunk = documents.slice(index, index + 500);
    if (!chunk.length) continue;
    const inserted = await Notification.insertMany(chunk, { ordered: false });
    notificationsCreated += inserted.length;
  }

  return {
    matchedUsers: users.length,
    notificationsCreated,
    skippedExisting: existingRecipients.size,
  };
};

module.exports = {
  deliverAnnouncementNotifications,
};
