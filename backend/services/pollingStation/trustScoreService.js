function calculateTrustScore({
  duplicateSubmission,
  gpsMatch,
  imageQuality,
  networkIssue
}) {
  let score = 100;

  if (duplicateSubmission) score -= 20;
  if (!gpsMatch) score -= 25;
  if (imageQuality < 70) score -= 10;
  if (networkIssue) score -= 5;

  return Math.max(score, 0);
}

module.exports = {
  calculateTrustScore
};
