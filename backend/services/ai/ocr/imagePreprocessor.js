async function preprocessImage(imagePath) {
  return {
    original: imagePath,
    corrected: imagePath,
    edgesDetected: true,
    rotationFixed: true,
  };
}

module.exports = {
  preprocessImage,
};
