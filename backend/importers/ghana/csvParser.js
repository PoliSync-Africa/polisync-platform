const fs = require("fs");

function parseCSV(filePath) {

  const raw = fs.readFileSync(filePath, "utf8");

  const lines = raw.split(/\r?\n/).filter(Boolean);

  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {

    const values = line.split(",");

    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || "";
    });

    return row;

  });

}

module.exports = {
  parseCSV
};
