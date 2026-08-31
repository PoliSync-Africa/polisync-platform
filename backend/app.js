const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const app = express();

const configuredFrontendUrl = String(process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
const allowedOrigins = ["https://polisync-app.onrender.com", configuredFrontendUrl].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Setup-Secret"],
  credentials: false,
}));

app.use(express.json({ limit: "400kb" }));
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./routes/auth");
const passwordResetRoutes = require("./routes/passwordResetRoutes");
const phoneOtpRoutes = require("./routes/phoneOtp");
const profileRoutes = require("./routes/profile");
const secureProfileRoutes = require("./routes/secureProfiles");
const privacyRoutes = require("./routes/privacy");
const messageRoutes = require("./routes/messages");
const secureNotificationRoutes = require("./routes/secureNotifications");
const organizationRoutes = require("./routes/organization");
const partyOrganizationRoutes = require("./routes/partyOrganization");
const personalWorkspaceRoutes = require("./routes/personalWorkspace");
const electoralGeographyRoutes = require("./routes/electoralGeography");
const electionRoutes = require("./routes/elections");
const pollingStationRoutes = require("./routes/pollingStationRoutes");
const resultRoutes = require("./routes/results");
const calendarRoutes = require("./routes/calendar");
const notificationRoutes = require("./routes/notifications");
const geoRoutes = require("./routes/geoRoutes");
const gisRoutes = require("./routes/gisRoutes");
const setupRoutes = require("./routes/setup");
const healthRoutes = require("./routes/health");
const aiRoutes = require("./routes/aiRoutes");
const platformUserRoutes = require("./routes/platformUsers");
const auditLogRoutes = require("./routes/auditLogs");
const announcementRoutes = require("./routes/announcements");

app.get("/", (req, res) => res.json({ success: true, app: "POLISYNC AFRICA Backend", status: "running", version: "1.0.0", database: "MongoDB + Mongoose" }));
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/auth", passwordResetRoutes);

// Personal and organizational registration: email is collected as contact
// information, but it is never a verification/access requirement.
app.use("/api/auth", (req, res, next) => {
  if (req.method !== "POST" || req.path !== "/register") return next();
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      const userId = body?.user?.id;
      if (body?.success && userId) {
        const approvedAt = new Date();
        await User.findByIdAndUpdate(userId, {
          $set: {
            accountStatus: "approved",
            approvedAt,
            emailVerified: true,
          },
        });
        body.user.accountStatus = "approved";
        body.user.emailVerified = true;
      }
    } catch (error) {
      console.error("Registration activation error:", error);
      return originalJson({ success: false, message: "Account was created but could not be activated automatically." });
    }
    return originalJson(body);
  };
  next();
}, authRoutes);

app.use("/api/phone-otp", phoneOtpRoutes);
app.use("/api/profile", secureProfileRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", secureNotificationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/party-organizations", partyOrganizationRoutes);
app.use("/api/personal-workspace", personalWorkspaceRoutes);
app.use("/api/electoral-geography", electoralGeographyRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/polling-stations", pollingStationRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/gis", gisRoutes);
app.use("/api/setup", setupRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/platform-users", platformUserRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/announcements", announcementRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((err, req, res, next) => { console.error("PoliSync API error:", err); res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" }); });

module.exports = app;
