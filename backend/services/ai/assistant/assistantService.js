async function ask(question) {
  return {
    question,
    answer:
      "This response will be generated dynamically by the AI engine.",
  };
}

module.exports = {
  ask,
};
