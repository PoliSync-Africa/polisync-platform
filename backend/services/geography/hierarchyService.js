
const GeoUnit = require("../../models/GeoUnit");

async function buildHierarchy(id) {
  const chain = [];

  let current = await GeoUnit.findById(id);

  while (current) {
    chain.unshift(current);
    current = current.parent
      ? await GeoUnit.findById(current.parent)
      : null;
  }

  return chain;
}

module.exports = {
  buildHierarchy
};
