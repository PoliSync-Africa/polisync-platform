const crypto = require("crypto");

const buckets = new Map();

const getClientKey = (req) => {
  // Authenticated users should receive an individual bucket. Using only the
  // proxy IP can make every request from a shared Render/frontend proxy count
  // against the same limit and causes false 429s in dashboard workspaces.
  const authorization = String(req.headers.authorization || "");
  if (authorization) {
    return `user:${crypto.createHash("sha256").update(authorization).digest("hex").slice(0, 32)}`;
  }
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return `ip:${forwarded || req.ip || req.socket?.remoteAddress || "unknown"}`;
};

const rateLimit = ({ windowMs, max, name }) => (req, res, next) => {
  const now = Date.now();
  const key = `${name}:${getClientKey(req)}`;
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(max - 1, 0)));
    return next();
  }
  current.count += 1;
  const remaining = Math.max(max - current.count, 0);
  res.set("X-RateLimit-Limit", String(max));
  res.set("X-RateLimit-Remaining", String(remaining));
  res.set("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
  if (current.count > max) return res.status(429).json({ success: false, code: "RATE_LIMITED", message: "Too many requests. Please wait and try again." });
  return next();
};

const removeMongoOperators = (value, depth = 0) => {
  if (depth > 20) return null;
  if (Array.isArray(value)) return value.map((item) => removeMongoOperators(item, depth + 1));
  if (!value || typeof value !== "object") return value;
  const output = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "__proto__" || key === "prototype" || key === "constructor") continue;
    if (key.startsWith("$") || key.includes(".")) continue;
    output[key] = removeMongoOperators(child, depth + 1);
  }
  return output;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") req.body = removeMongoOperators(req.body);
  if (req.params && typeof req.params === "object") req.params = removeMongoOperators(req.params);
  if (req.query && typeof req.query === "object") {
    for (const key of Object.keys(req.query)) if (key.startsWith("$") || key.includes(".") || ["__proto__", "prototype", "constructor"].includes(key)) delete req.query[key];
  }
  return next();
};

const securityHeaders = (req, res, next) => {
  res.removeHeader("X-Powered-By");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  // Camera/microphone/geolocation are needed by the authenticated web app.
  res.set("Permissions-Policy", "camera=(self), microphone=(self), geolocation=(self), payment=()");
  res.set("Cross-Origin-Resource-Policy", "same-site");
  res.set("Cache-Control", "no-store");
  if (process.env.NODE_ENV === "production") res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  if (!req.headers["x-request-id"]) res.set("X-Request-ID", crypto.randomUUID());
  return next();
};

const cleanupRateLimitBuckets = () => { const now = Date.now(); for (const [key, bucket] of buckets.entries()) if (now >= bucket.resetAt) buckets.delete(key); };
const cleanupTimer = setInterval(cleanupRateLimitBuckets, 10 * 60 * 1000);
if (typeof cleanupTimer.unref === "function") cleanupTimer.unref();

module.exports = { rateLimit, sanitizeRequest, securityHeaders };
