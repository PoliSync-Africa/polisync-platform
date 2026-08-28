function validatePollingStation(row) {
  return row.region && row.constituency && row.code && row.name;
}

module.exports = {
  validatePollingStation,
};
