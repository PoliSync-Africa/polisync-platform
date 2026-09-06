const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");
const { syncPollingStationsFromEcPdf } = require("../scripts/syncPollingStationsFromEc");
const { ensureElectoralGeography } = require("../scripts/ensureElectoralGeography");

async function ensureReady() {
  return ensureElectoralGeography();
}

exports.regions = async (req, res) => {
  try {
    await ensureReady();
    const data = await Region.find({ isActive: true }).sort({ regionNumber: 1, name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana regions bootstrap failed:", error);
    res.status(503).json({ success: false, code: "ELECTORAL_GEOGRAPHY_UNAVAILABLE", message: "Ghana electoral geography is still being prepared. Please refresh shortly." });
  }
};

exports.constituencies = async (req, res) => {
  try {
    await ensureReady();
    const filter = { isActive: true };
    if (req.params.regionId) filter.regionId = req.params.regionId;
    const data = await Constituency.find(filter).sort({ constituencyNumber: 1, name: 1 }).lean();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana constituencies bootstrap failed:", error);
    res.status(503).json({ success: false, code: "ELECTORAL_GEOGRAPHY_UNAVAILABLE", message: "Ghana electoral geography is still being prepared. Please refresh shortly." });
  }
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
  const aliases = await Constituency.find({ isActive: true, name: selected.name }).select("_id").lean();
  return findPollingStations({ isActive: true, constituencyId: { $in: aliases.map(c => c._id) } });
}

exports.pollingStations = async (req, res) => {
  const filter = { isActive: true };
  const constituencyId = req.params.constituencyId || req.query.constituencyId;
  if (constituencyId) filter.constituencyId = constituencyId;
  if (req.query.regionId) filter.regionId = req.query.regionId;

  try {
    await ensureReady();
    let data = await findPollingStations(filter);

    if (data.length === 0 && constituencyId && !req.query.regionId) {
      data = await findStationsForConstituencyWithLegacyAliases(constituencyId);
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana polling-station bootstrap failed:", error);
    res.status(503).json({ success: false, code: "ELECTORAL_GEOGRAPHY_UNAVAILABLE", message: "Ghana polling-station data is still being prepared. Please refresh shortly." });
  }
};

exports.station = async (req, res) => {
  const data = await PollingStation.findOne({ _id: req.params.stationId, isActive: true }).lean();
  if (!data) return res.status(404).json({ success: false, message: "Polling station not found." });
  res.json({ success: true, data });
};

exports.search = async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ success: false, message: "Search query is required." });
  try {
    await ensureReady();
    const [regions, constituencies, pollingStations] = await Promise.all([
      Region.find({ isActive: true, name: { $regex: q, $options: "i" } }).limit(20).lean(),
      Constituency.find({ isActive: true, name: { $regex: q, $options: "i" } }).limit(50).lean(),
      PollingStation.find({ isActive: true, $or: [{ name: { $regex: q, $options: "i" } }, { pollingStationCode: { $regex: q, $options: "i" } }] }).limit(50).lean(),
    ]);
    res.json({ success: true, data: { regions, constituencies, pollingStations } });
  } catch (error) {
    console.error("Ghana geography search bootstrap failed:", error);
    res.status(503).json({ success: false, code: "ELECTORAL_GEOGRAPHY_UNAVAILABLE", message: "Ghana electoral geography is still being prepared. Please refresh shortly." });
  }
};

exports.summary = async (req, res) => {
  try {
    const ready = await ensureReady();
    const [regions, constituencies, pollingStations] = await Promise.all([
      Region.countDocuments({ isActive: true }),
      Constituency.countDocuments({ isActive: true }),
      PollingStation.countDocuments({ isActive: true }),
    ]);
    res.json({ success: true, data: { regions, constituencies, pollingStations, ready: Boolean(ready) } });
  } catch (error) {
    console.error("Ghana geography summary bootstrap failed:", error);
    res.status(503).json({ success: false, code: "ELECTORAL_GEOGRAPHY_UNAVAILABLE", message: "Ghana electoral geography is still being prepared. Please refresh shortly." });
  }
};
