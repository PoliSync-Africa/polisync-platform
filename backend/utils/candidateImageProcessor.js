const sharp = require("sharp");

const MAX_WIDTH = 600;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 86;

function parseDataUrl(value) {
  const match = /^data:image\/(png|jpe?g|webp|avif|gif);base64,(.+)$/i.exec(String(value || ""));
  if (!match) return null;
  return Buffer.from(match[2], "base64");
}

function colorDistance(r, g, b, br, bg, bb) {
  return Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
}

async function removeSimpleBackground(buffer) {
  const image = sharp(buffer).rotate();
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  if (!width || !height || channels < 4) return buffer;

  const samples = [];
  const points = [
    [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
    [Math.floor(width / 2), 0], [0, Math.floor(height / 2)],
    [width - 1, Math.floor(height / 2)], [Math.floor(width / 2), height - 1],
  ];
  for (const [x, y] of points) {
    const i = (y * width + x) * channels;
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  const bg = samples.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]).map(v => v / samples.length);
  const threshold = 52;
  const visited = new Uint8Array(width * height);
  const queue = [];
  for (const [x, y] of points) queue.push(y * width + x);

  while (queue.length) {
    const p = queue.pop();
    if (visited[p]) continue;
    visited[p] = 1;
    const x = p % width;
    const y = Math.floor(p / width);
    const i = p * channels;
    if (colorDistance(data[i], data[i + 1], data[i + 2], bg[0], bg[1], bg[2]) > threshold) continue;
    data[i + 3] = 0;
    if (x > 0) queue.push(p - 1);
    if (x < width - 1) queue.push(p + 1);
    if (y > 0) queue.push(p - width);
    if (y < height - 1) queue.push(p + width);
  }

  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function processCandidateImage(dataUrl) {
  const source = parseDataUrl(dataUrl);
  if (!source) return dataUrl;

  let processed = await removeSimpleBackground(source);
  processed = await sharp(processed)
    .resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 }, withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .modulate({ brightness: 1.04, saturation: 1.02 })
    .sharpen({ sigma: 0.7 })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();

  return `data:image/jpeg;base64,${processed.toString("base64")}`;
}

async function processCandidateFields(candidates) {
  if (!Array.isArray(candidates)) return;
  for (const candidate of candidates) {
    if (candidate?.profilePictureUrl?.startsWith("data:image/")) {
      candidate.profilePictureUrl = await processCandidateImage(candidate.profilePictureUrl);
    }
  }
}

module.exports = { processCandidateImage, processCandidateFields };
