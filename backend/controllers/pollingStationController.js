const mongoose = require("mongoose");
const PollingStation = require("../models/PollingStation");
const OrganizationMembership = require("../models/OrganizationMembership");
const stationProfileService = require("../services/pollingStation/stationProfileService");

const objectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

async function canAccessStation(req, station) {
  if (!station || station.isActive === false) return false;
  if (req.user?.platformRole === "super_admin") return true;

  const memberships = await OrganizationMembership.find({
    userId: req.user._id,
    status: "approved",
  }).select("role regionId constituencyId pollingStationId").lean();

  if (memberships.some((m) =>
    m.role === "national_party_admin" ||
    m.role === "national_observer_admin"
  )) return true;

  return memberships.some((m) => {
    if (m.pollingStationId && String(m.pollingStationId) === String(station._id)) return true;
    if (m.constituencyId && String(m.constituencyId) === String(station.constituencyId)) return true;
    if (m.regionId && String(m.regionId) === String(station.regionId)) return true;
    return false;
  });
}

exports.getStationProfile = async (req, res) => {
  try {
    if (!objectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid polling station ID." });
    }

    const station = await PollingStation.findById(req.params.id)
      .select("_id name pollingStationCode regionId constituencyId district stationType isActive")
      .lean();

    if (!station || !(await canAccessStation(req, station))) {
      return res.status(404).json({ success: false, message: "Polling station not found." });
    }

    const profile = await stationProfileService.getProfile(station._id);
    return res.json({
      success: true,
      data: {
        station,
        profile: profile || null,
      },
    });
  } catch (error) {
    console.error("Polling station profile error:", error);
    return res.status(500).json({ success: false, message: "Unable to load polling station profile." });
  }
};

exports.canAccessStation = canAccessStation;
