const Result = require("../../models/Result");
const PollingStation = require("../../models/PollingStation");

async function aggregateConstituencyResults(electionId, constituency) {
  const stations = await PollingStation.find({ constituency });

  const stationIds = stations.map((station) => station._id);

  const results = await Result.find({
    electionId,
    pollingStationId: { $in: stationIds },
    verificationStatus: "verified"
  });

  const totals = {};
  let totalValidVotes = 0;
  let rejectedVotes = 0;
  let totalBallots = 0;

  results.forEach((result) => {
    totalValidVotes += result.totalValidVotes;
    rejectedVotes += result.rejectedVotes;
    totalBallots += result.totalBallots;

    result.candidateResults.forEach((candidate) => {
      if (!totals[candidate.candidateId]) {
        totals[candidate.candidateId] = {
          candidateId: candidate.candidateId,
          candidateName: candidate.candidateName,
          party: candidate.party,
          votes: 0
        };
      }

      totals[candidate.candidateId].votes += candidate.votes;
    });
  });

  return {
    constituency,
    pollingStations: stations.length,
    verifiedStations: results.length,
    totalValidVotes,
    rejectedVotes,
    totalBallots,
    candidates: Object.values(totals).sort((a, b) => b.votes - a.votes)
  };
}

module.exports = {
  aggregateConstituencyResults
};
