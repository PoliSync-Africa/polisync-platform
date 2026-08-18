const databaseConfig = {
  name: "POLISYNC_AFRICA",
  provider: "MongoDB",
  status: "Not Connected Yet",
  collections: [
    "users",
    "political_parties",
    "members",
    "candidates",
    "elections",
    "polling_stations",
    "results",
    "research",
    "meetings",
    "finance"
  ]
};

module.exports = databaseConfig;
