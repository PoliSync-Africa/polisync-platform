const Country = require("../../models/Country");

const {
  importPollingStations
} = require("./pollingStationImporter");

async function runECImport() {

  const ghana = await Country.findOne({ code: "GH" });

  if (!ghana) {
    throw new Error("Ghana not found.");
  }

  const result =
    await importPollingStations(
      "uploads/ec/polling-stations/ghana-polling-stations.csv",
      ghana._id
    );

  return result;

}

module.exports = {
  runECImport
};
