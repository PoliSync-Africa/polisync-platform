const GeoUnit = require("../../models/GeoUnit");

const { parseCSV } = require("./csvParser");

const { validatePollingStation } = require("./validator");

async function importPollingStations(filePath, countryId) {

  const rows = parseCSV(filePath);

  let imported = 0;

  let skipped = 0;

  for (const row of rows) {

    if (!validatePollingStation(row)) {
      skipped++;
      continue;
    }

    const region = await GeoUnit.findOne({
      country: countryId,
      level: "Region",
      name: row.region
    });

    const constituency = await GeoUnit.findOne({
      country: countryId,
      level: "Constituency",
      name: row.constituency
    });

    if (!constituency) {
      skipped++;
      continue;
    }

    await GeoUnit.updateOne(

      { code: row.code },

      {
        country: countryId,
        parent: constituency._id,
        name: row.name,
        code: row.code,
        level: "PollingStation",
        gps: {
          latitude: Number(row.latitude),
          longitude: Number(row.longitude)
        }
      },

      { upsert: true }

    );

    imported++;

  }

  return {
    imported,
    skipped
  };

}

module.exports = {
  importPollingStations
};
