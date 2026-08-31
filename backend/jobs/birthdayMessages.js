const User = require("../models/User");
const Notification = require("../models/Notification");
const BirthdayMessageLog = require("../models/BirthdayMessageLog");
const { sendSms } = require("../services/arkeselSmsService");

const GHANA_TIME_ZONE = "Africa/Accra";
const JOB_HOUR = 8;

function todayInGhana() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: GHANA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function birthdayMessage(firstName) {
  const name = String(firstName || "there").trim().replace(/[\r\n]+/g, " ");
  return `Happy Birthday, ${name}! PoliSync Africa wishes you a wonderful birthday filled with joy, good health and success. Thank you for being part of PoliSync Africa.`;
}

async function processBirthdayMessages() {
  const birthdayDate = todayInGhana();
  const [, month, day] = birthdayDate.split("-");

  const users = await User.find({
    platformRole: "user",
    accountStatus: "approved",
    dateOfBirth: { $ne: null },
    phone: { $exists: true, $ne: "" },
  }).select("_id firstName displayName phone dateOfBirth").lean();

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const dob = new Date(user.dateOfBirth);
    if (Number.isNaN(dob.getTime())) continue;
    const dobMonth = String(dob.getUTCMonth() + 1).padStart(2, "0");
    const dobDay = String(dob.getUTCDate()).padStart(2, "0");
    if (dobMonth !== month || dobDay !== day) continue;

    const existing = await BirthdayMessageLog.findOne({ user: user._id, birthdayDate });
    if (existing) {
      skipped += 1;
      continue;
    }

    const message = birthdayMessage(user.firstName || user.displayName || "there");

    try {
      const result = await sendSms({ phone: user.phone, message });

      await BirthdayMessageLog.create({
        user: user._id,
        birthdayDate,
        phone: result.recipient,
        status: "sent",
        provider: "arkesel",
        providerCode: result.response?.code ? String(result.response.code) : null,
        providerMessage: result.response?.message || result.response?.status || null,
        sentAt: new Date(),
      });

      await Notification.create({
        recipient: user._id,
        type: "system",
        channel: "in_app",
        title: "Happy Birthday!",
        message,
        status: "sent",
        metadata: { event: "birthday", birthdayDate },
        createdBy: null,
      });

      sent += 1;
    } catch (error) {
      failed += 1;
      try {
        await BirthdayMessageLog.create({
          user: user._id,
          birthdayDate,
          phone: user.phone,
          status: "failed",
          provider: "arkesel",
          providerCode: error.providerCode || null,
          providerMessage: error.providerResponse?.message || null,
          error: error.message || "Birthday SMS failed.",
        });
      } catch (logError) {
        if (logError?.code !== 11000) console.error("Birthday log error:", logError);
      }
      console.error(`Birthday SMS failed for user ${user._id}:`, error.message);
    }
  }

  console.log(`🎂 Birthday job ${birthdayDate}: sent=${sent}, skipped=${skipped}, failed=${failed}`);
  return { birthdayDate, sent, skipped, failed };
}

function startBirthdayJob() {
  const runAtNextMinute = () => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: GHANA_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
    return Number(parts.hour) === JOB_HOUR && Number(parts.minute) === 0;
  };

  let lastRunDate = null;
  const timer = setInterval(async () => {
    if (!runAtNextMinute()) return;
    const date = todayInGhana();
    if (lastRunDate === date) return;
    lastRunDate = date;
    try { await processBirthdayMessages(); } catch (error) { console.error("Birthday job failed:", error); }
  }, 30 * 1000);

  timer.unref?.();
  console.log("🎂 Birthday automation enabled: daily at 08:00 Africa/Accra.");
  return timer;
}

module.exports = { processBirthdayMessages, startBirthdayJob, birthdayMessage };
