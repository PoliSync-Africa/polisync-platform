async function translate(text, targetLanguage) {
  return {
    original: text,
    translated: text,
    language: targetLanguage,
  };
}

module.exports = {
  translate,
};
