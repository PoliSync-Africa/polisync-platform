const Region = require("../models/Region");
const Constituency = require("../models/Constituency");
const PollingStation = require("../models/PollingStation");

async function findPollingStations(filter) {
  return PollingStation.find(filter).sort({ name: 1 }).select("pollingStationCode name regionId constituencyId district stationType source sourceYear isActive").lean();
}

async function findStationsForConstituencyWithLegacyAliases(constituencyId) {
  const selected = await Constituency.findOne({ _id: constituencyId, isActive: true }).lean();
  if (!selected) return [];
  const aliases = await Constituency.find({ isActive: true, name: selected.name }).select("_id").lean();
  return findPollingStations({ isActive: true, constituencyId: { $in: aliases.map(c => c._id) } });
}

exports.regions = async (req, res) => {
  try {
    const data = await Region.find({ isActive: true }).sort({ regionNumber: 1, name: 1 }).lean();
    res.set("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana regions read failed:", error);
    res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_READ_FAILED", message: "Unable to load Ghana regions." });
  }
};

exports.constituencies = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.params.regionId) filter.regionId = req.params.regionId;
    const data = await Constituency.find(filter).sort({ constituencyNumber: 1, name: 1 }).lean();
    res.set("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana constituencies read failed:", error);
    res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_READ_FAILED", message: "Unable to load Ghana constituencies." });
  }
};

exports.pollingStations = async (req, res) => {
  const filter = { isActive: true };
  const constituencyId = req.params.constituencyId || req.query.constituencyId;
  if (constituencyId) filter.constituencyId = constituencyId;
  if (req.query.regionId) filter.regionId = req.query.regionId;
  try {
    let data = await findPollingStations(filter);
    if (data.length === 0 && constituencyId && !req.query.regionId) data = await findStationsForConstituencyWithLegacyAliases(constituencyId);
    res.set("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana polling-station read failed:", error);
    res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_READ_FAILED", message: "Unable to load Ghana polling-station data." });
  }
};

exports.station = async (req, res) => {
  try {
    const data = await PollingStation.findOne({ _id: req.params.stationId, isActive: true }).lean();
    if (!data) return res.status(404).json({ success: false, message: "Polling station not found." });
    res.set("Cache-Control", "no-store, max-age=0");
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Ghana polling-station read failed:", error);
    return res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_READ_FAILED", message: "Unable to load polling station." });
  }
};

exports.search = async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.status(400).json({ success: false, message: "Search query is required." });
  try {
    const [regions, constituencies, pollingStations] = await Promise.all([
      Region.find({ isActive: true, name: { $regex: q, $options: "i" } }).limit(20).lean(),
      Constituency.find({ isActive: true, name: { $regex: q, $options: "i" } }).limit(50).lean(),
      PollingStation.find({ isActive: true, $or: [{ name: { $regex: q, $options: "i" } }, { pollingStationCode: { $regex: q, $options: "i" } }] }).limit(50).lean(),
    ]);
    res.set("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data: { regions, constituencies, pollingStations } });
  } catch (error) {
    console.error("Ghana geography search failed:", error);
    res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_READ_FAILED", message: "Unable to search Ghana electoral geography." });
  }
};

exports.summary = async (req, res) => {
  try {
    const [regions, constituencies, pollingStations] = await Promise.all([
      Region.countDocuments({ isActive: true }),
      Constituency.countDocuments({ isActive: true }),
      PollingStation.countDocuments({ isActive: true }),
    ]);
    res.set("Cache-Control", "no-store, max-age=0");
    res.json({ success: true, data: { regions, constituencies, pollingStations, ready: regions === 16 && constituencies === 276 && pollingStations >= 40000 } });
  } catch (error) {
    console.error("Ghana geography summary read failed:", error);
    res.status(500).json({ success: false, code: "ELECTORAL_GEOGRAPHY_READ_FAILED", message: "Unable to load electoral geography status." });
  }
};
