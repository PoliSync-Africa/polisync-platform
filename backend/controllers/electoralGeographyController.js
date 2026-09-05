const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const { syncPollingStationsFromEcPdf } = require("../scripts/syncPollingStationsFromEc");

exports.regions = async (req, res) => {
  const data = await Region.find({ isActive: true }).sort({ regionNumber: 1, name: 1 }).lean();
  res.json({ success: true, data });
};

exports.constituencies = async (req, res) => {
  const filter = { isActive: true };
  if (req.params.regionId) filter.regionId = req.params.regionId;
  const data = await Constituency.find(filter).sort({ constituencyNumber: 1, name: 1 }).lean();
  res.json({ success: true, data });
};

async function findPollingStations(filter) {
  return PollingStation.find(filter)
    .sort({ name: 1 })
    .select("pollingStationCode name regionId constituencyId district stationType source sourceYear isActive")
    .lean();
}

async function findStationsForConstituencyWithLegacyAliases(constituencyId) {
  const selected = await Constituency.findOne({ _id: constituencyId, isActive: true }).lean();
  if (!selected) return [];

  // Legacy imports can leave more than one active Constituency document with
  // the same official name. Treat those records as aliases of the same EC
  // constituency so an older linked station is still visible from the UI.
  const aliases = await Constituency.find({
    isActive: true,
    name: selected.name,
  }).select("_id").lean();
  const ids = aliases.map(c => c._id);
  return findPollingStations({ isActive: true, constituencyId: { $in: ids } });
}

exports.pollingStations = async (req, res) => {
  const filter = { isActive: true };

  // Accept both the REST path parameter and query-string form.
  const constituencyId = req.params.constituencyId || req.query.constituencyId;
  if (constituencyId) filter.constituencyId = constituencyId;
  if (req.query.regionId) filter.regionId = req.query.regionId;

  let data = await findPollingStations(filter);

  // If a selected constituency is empty, first repair/synchronize the EC
  // register, then retry the exact filter.
  if (data.length === 0 && (constituencyId || req.query.regionId)) {
    try {
      await syncPollingStationsFromEcPdf();
      data = await findPollingStations(filter);

      // Final compatibility fallback for databases that contain duplicate
      // legacy Constituency records with the same official name.
      if (data.length === 0 && constituencyId && !req.query.regionId) {
        data = await findStationsForConstituencyWithLegacyAliases(constituencyId);
      }
    } catch (error) {
      console.error("Polling station EC sync failed:", error);
      return res.status(503).json({
        success: false,
        code: "POLLING_STATION_SYNC_FAILED",
        message: "The official polling-station register could not be synchronized yet. Please try Refresh again.",
      });
    }
  }

  // If no geographic filter was supplied and the collection is empty, also
  // bootstrap the register so the general polling-station endpoint works.
  if (data.length === 0 && !constituencyId && !req.query.regionId) {
    try {
      const totalStations = await PollingStation.countDocuments({ isActive: true });
      if (totalStations === 0) {
        await syncPollingStationsFromEcPdf();
        data = await findPollingStations(filter);
      }
    } catch (error) {
      console.error("Polling station EC sync failed:", error);
      return res.status(503).json({
        success: false,
        code: "POLLING_STATION_SYNC_FAILED",
        message: "The official polling-station register could not be synchronized yet. Please try Refresh again.",
      });
    }
  }

  res.json({ success: true, data });
};

exports.station = async (req, res) => {
  const data = await PollingStation.findOne({
    _id: req.params.stationId,
    isActive: true,
  }).lean();
  if (!data) return res.status(404).json({ success: false, message: "Polling station not found." });
  res.json({ success: true, data });
};

exports.search = async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ success: false, message: "Search query is required." });

  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.find({ isActive: true, name: { $regex: q, $options: "i" } }).limit(20).lean(),
    Constituency.find({ isActive: true, name: { $regex: q, $options: "i" } }).limit(50).lean(),
    PollingStation.find({
      isActive: true,
      $or: [
        { name: { $regex: q, $options: "i" } },
        { pollingStationCode: { $regex: q, $options: "i" } },
      ],
    }).limit(50).lean(),
  ]);

  res.json({ success: true, data: { regions, constituencies, pollingStations } });
};

exports.summary = async (req, res) => {
  const [regions, constituencies, pollingStations] = await Promise.all([
    Region.countDocuments({ isActive: true }),
    Constituency.countDocuments({ isActive: true }),
    PollingStation.countDocuments({ isActive: true }),
  ]);
  res.json({ success: true, data: { regions, constituencies, pollingStations } });
};
