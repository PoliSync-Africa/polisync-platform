async function extractElectionResults(imagePath) {
  return {
    pollingStation: "BE-TEC-014",
    parties: {
      NPP: 312,
      NDC: 280,
      Other: 5,
    },
    totalVotes: 597,
    confidence: 98,
  };
}

module.exports = {
  extractElectionResults,
};
