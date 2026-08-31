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
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
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
let organizationRoutes; try { organizationRoutes = require("./routes/organization"); } catch { organizationRoutes = null; }
let partyOrganizationRoutes; try { partyOrganizationRoutes = require("./routes/partyOrganization"); } catch { partyOrganizationRoutes = null; }
let personalWorkspaceRoutes; try { personalWorkspaceRoutes = require("./routes/personalWorkspace"); } catch { personalWorkspaceRoutes = null; }
let electoralGeographyRoutes; try { electoralGeographyRoutes = require("./routes/electoralGeography"); } catch { electoralGeographyRoutes = null; }
let electionRoutes; try { electionRoutes = require("./routes/elections"); } catch { electionRoutes = null; }
let pollingStationRoutes; try { pollingStationRoutes = require("./routes/pollingStationRoutes"); } catch { pollingStationRoutes = null; }
let resultRoutes; try { resultRoutes = require("./routes/results"); } catch { resultRoutes = null; }
let calendarRoutes; try { calendarRoutes = require("./routes/calendar"); } catch { calendarRoutes = null; }
let notificationRoutes; try { notificationRoutes = require("./routes/notifications"); } catch { notificationRoutes = null; }
let geoRoutes; try { geoRoutes = require("./routes/geoRoutes"); } catch { geoRoutes = null; }
let gisRoutes; try { gisRoutes = require("./routes/gisRoutes"); } catch { gisRoutes = null; }
let setupRoutes; try { setupRoutes = require("./routes/setup"); } catch { setupRoutes = null; }
const platformUserRoutes = require("./routes/platformUsers");

app.get("/", (req, res) => res.json({ success: true, app: "POLISYNC AFRICA Backend", status: "running", version: "1.0.0", database: "MongoDB + Mongoose" }));

// Password reset routes must be registered before the legacy auth routes.
app.use("/api/auth", passwordResetRoutes);

// Personal accounts are self-created and do not wait for Super Admin account approval.
// Keep email/phone verification and all security checks intact.
app.use("/api/auth", (req, res, next) => {
  if (req.method !== "POST" || req.path !== "/register") return next();
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      const userId = body?.user?.id;
      if (body?.success && userId) {
        const approvedAt = new Date();
        await User.findByIdAndUpdate(userId, { $set: { accountStatus: "approved", approvedAt } });
        body.user.accountStatus = "approved";
      }
    } catch (error) {
      console.error("Personal account auto-approval error:", error);
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
if (organizationRoutes) app.use("/api/organizations", organizationRoutes);
if (partyOrganizationRoutes) app.use("/api/party-organizations", partyOrganizationRoutes);
if (personalWorkspaceRoutes) app.use("/api/personal-workspace", personalWorkspaceRoutes);
if (electoralGeographyRoutes) app.use("/api/electoral-geography", electoralGeographyRoutes);
if (electionRoutes) app.use("/api/elections", electionRoutes);
if (pollingStationRoutes) app.use("/api/polling-stations", pollingStationRoutes);
if (resultRoutes) app.use("/api/results", resultRoutes);
if (calendarRoutes) app.use("/api/calendar", calendarRoutes);
if (geoRoutes) app.use("/api/geo", geoRoutes);
if (gisRoutes) app.use("/api/gis", gisRoutes);
if (setupRoutes) app.use("/api/setup", setupRoutes);
app.use("/api/platform-users", platformUserRoutes);

app.use((req, res) => res.status(404).json({ success: false, message: "Route not found." }));
app.use((err, req, res, next) => { console.error("PoliSync API error:", err); res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" }); });

module.exports = app;
