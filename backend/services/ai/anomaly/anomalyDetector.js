function detectAnomalies(result) {
  const alerts = [];

  if (result.duplicate) {
    alerts.push("Duplicate submission detected.");
  }

  if (result.gpsMismatch) {
    alerts.push("GPS mismatch detected.");
  }

  if (result.voteSpike) {
    alerts.push("Unusual vote spike detected.");
  }

  return {
    trustScore: alerts.length === 0 ? 98 : 72,
    alerts,
  };
}

module.exports = {
  detectAnomalies,
};
