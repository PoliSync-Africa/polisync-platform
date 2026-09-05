async function generateReport(data) {
  return {
    title: "Election Operations Report",
    summary:
      "Automated executive summary generated from election data.",
    generatedAt: new Date(),
    data,
  };
}

module.exports = {
  generateReport,
};
