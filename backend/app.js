const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const { securityHeaders, sanitizeRequest, rateLimit } = require("./middleware/security");
const app = express();

const configuredFrontendUrl = String(process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
const allowedOrigins = ["https://polisync-app.onrender.com", configuredFrontendUrl].filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(securityHeaders);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS origin not allowed."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "X-Setup-Secret", "X-PoliSync-API-Token", "X-Request-ID"],
  credentials: false,
}));
app.use(express.json({ limit: "400kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "100kb", parameterLimit: 100 }));
app.use(sanitizeRequest);

const apiRateLimiter = rateLimit({ windowMs: 60 * 1000, max: 300, name: "api" });
const authRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, name: "auth" });
const otpRateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, name: "otp" });
const setupRateLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, name: "setup" });

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
const personalOperationsRoutes = require("./routes/personalOperations");
const electoralGeographyRoutes = require("./routes/electoralGeography");
const electoralGeographyIntegrityRoutes = require("./routes/electoralGeographyIntegrity");
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
const superAdminWorkspaceRoutes = require("./routes/superAdminWorkspace");

app.get("/", (req, res) => res.json({ success: true, app: "POLISYNC AFRICA Backend", status: "running", version: "1.0.0", database: "MongoDB + Mongoose" }));
app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// Apply broad API protection before every authenticated/public API route.
app.use("/api", apiRateLimiter);

// Authentication and password recovery are deliberately much stricter than ordinary API traffic.
app.use("/api/auth", authRateLimiter);
app.use("/api/auth", passwordResetRoutes);
app.use("/api/auth", (req, res, next) => {
  if (req.method !== "POST" || req.path !== "/register") return next();
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      const userId = body?.user?.id;
      if (body?.success && userId) {
        const approvedAt = new Date();
        await User.findByIdAndUpdate(userId, { $set: { accountStatus: "approved", approvedAt, emailVerified: true } });
        body.user.accountStatus = "approved";
        body.user.emailVerified = true;
        body.message = "Account created successfully. Use the Arkesel SMS verification code for account security. Your email does not require verification.";
        if (body.notifications) body.notifications.email = false;
      }
    } catch (error) {
      console.error("Registration activation error:", error);
      return originalJson({ success: false, message: "Account was created but could not be activated automatically." });
    }
    return originalJson(body);
  };
  next();
}, authRoutes);

// OTP endpoints receive an additional abuse-control layer.
app.use("/api/phone-otp", otpRateLimiter, phoneOtpRoutes);

// /me must be handled before the secure /:userId profile route.
app.use("/api/profile", profileRoutes);
app.use("/api/profile", secureProfileRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", secureNotificationRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/party-organizations", partyOrganizationRoutes);
app.use("/api/personal-workspace", personalWorkspaceRoutes);
app.use("/api/personal-operations", personalOperationsRoutes);
app.use("/api/electoral-geography", electoralGeographyRoutes);
app.use("/api/electoral-geography/integrity", electoralGeographyIntegrityRoutes);
app.use("/api/elections", electionRoutes);
app.use("/api/polling-stations", pollingStationRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/geo", geoRoutes);
app.use("/api/gis", gisRoutes);
app.use("/api/setup", setupRateLimiter, setupRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/platform-users", platformUserRoutes);
app.use("/api/audit-logs", auditLogRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/super-admin/workspaces", superAdminWorkspaceRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((err, req, res, next) => {
  console.error("PoliSync API error:", err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = status >= 500 ? "Internal Server Error" : (err.message || "Request failed.");
  res.status(status).json({ success: false, message });
});
module.exports = app;
