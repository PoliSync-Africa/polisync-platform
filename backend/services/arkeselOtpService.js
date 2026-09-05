require("dotenv").config();

const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY;
const ARKESEL_OTP_BASE_URL = (process.env.ARKESEL_OTP_BASE_URL || "https://sms.arkesel.com/api/otp").replace(/\/+$/, "");
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "POLISYNC";
const DEFAULT_OTP_EXPIRY = 5;
const DEFAULT_OTP_LENGTH = 6;
const MAX_OTP_LENGTH = 15;
const REQUEST_TIMEOUT_MS = 15000;

function validateConfiguration() {
  if (!ARKESEL_API_KEY) throw new Error("ARKESEL_API_KEY is not configured.");
  if (!SMS_SENDER_ID || SMS_SENDER_ID.length > 11) throw new Error("SMS_SENDER_ID must be 1-11 characters.");
}

function normalizeGhanaPhone(phone) {
  if (!phone) return null;
  let value = String(phone).trim().replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(value)) value = `233${value.slice(1)}`;
  if (/^\+233\d{9}$/.test(value)) value = value.slice(1);
  if (!/^233\d{9}$/.test(value)) return null;
  return value;
}

function timeoutSignal() {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return controller.signal;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function arkeselRequest(endpoint, body) {
  validateConfiguration();
  let response;
  try {
    response = await fetch(`${ARKESEL_OTP_BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "api-key": ARKESEL_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: timeoutSignal(),
    });
  } catch (error) {
    const err = new Error(error?.name === "AbortError" ? "Arkesel OTP request timed out." : `Unable to connect to Arkesel OTP service: ${error.message || "network error"}`);
    err.retryable = true;
    throw err;
  }
  const data = await parseResponse(response);
  return { httpStatus: response.status, ok: response.ok, data };
}

function buildOTPMessage({ firstName, purpose, expiry }) {
  const name = String(firstName || "there").trim().replace(/[\r\n]+/g, " ");
  const safePurpose = String(purpose || "phone verification").trim().replace(/[\r\n]+/g, " ");
  return `Hello ${name}, your PoliSync Africa ${safePurpose} code is %otp_code%. It expires in %expiry% minutes. Do not share this code.`;
}

async function generateOTP({ phone, firstName, expiry = DEFAULT_OTP_EXPIRY, length = DEFAULT_OTP_LENGTH, purpose = "phone verification" }) {
  const number = normalizeGhanaPhone(phone);
  if (!number) throw new Error("Invalid Ghana phone number.");
  const normalizedExpiry = Number(expiry);
  const normalizedLength = Number(length);
  if (!Number.isInteger(normalizedExpiry) || normalizedExpiry < 1 || normalizedExpiry > 10) throw new Error("OTP expiry must be between 1 and 10 minutes.");
  if (!Number.isInteger(normalizedLength) || normalizedLength < 6 || normalizedLength > MAX_OTP_LENGTH) throw new Error(`OTP length must be between 6 and ${MAX_OTP_LENGTH} digits.`);

  const body = { expiry: normalizedExpiry, length: normalizedLength, medium: "sms", message: buildOTPMessage({ firstName, purpose, expiry: normalizedExpiry }), number, sender_id: SMS_SENDER_ID, type: "numeric" };
  let result;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await arkeselRequest("generate", body);
      if (String(result.data?.code) !== "1011") break;
    } catch (error) {
      if (!error.retryable || attempt === 2) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
  }

  const { httpStatus, ok, data } = result;
  if (ok && String(data?.code) === "1000") {
    return { success: true, provider: "arkesel", operation: "otp_generation", number, senderId: SMS_SENDER_ID, expiresInMinutes: normalizedExpiry, length: normalizedLength, response: data, httpStatus };
  }

  const error = new Error(data?.message || data?.error || `Arkesel OTP generation failed (${httpStatus}).`);
  error.provider = "arkesel";
  error.providerCode = data?.code ? String(data.code) : String(httpStatus);
  error.providerResponse = data;
  error.httpStatus = httpStatus;
  throw error;
}

async function verifyOTP({ phone, code }) {
  const number = normalizeGhanaPhone(phone);
  if (!number) throw new Error("Invalid Ghana phone number.");
  const normalizedCode = String(code || "").trim();
  if (!/^\d{6,15}$/.test(normalizedCode)) throw new Error("Invalid OTP format.");

  const result = await arkeselRequest("verify", { code: normalizedCode, number });
  const { httpStatus, ok, data } = result;
  if (ok && String(data?.code) === "1100") return { success: true, verified: true, provider: "arkesel", operation: "otp_verification", number, response: data, httpStatus };

  return { success: false, verified: false, provider: "arkesel", operation: "otp_verification", providerCode: data?.code ? String(data.code) : String(httpStatus), number, message: data?.message || data?.error || "OTP verification failed.", response: data, httpStatus };
}

const sendPhoneVerificationOTP = ({ phone, firstName }) => generateOTP({ phone, firstName, purpose: "phone verification" });
const sendPasswordResetOTP = ({ phone, firstName }) => generateOTP({ phone, firstName, purpose: "password reset" });
const sendLoginOTP = ({ phone, firstName }) => generateOTP({ phone, firstName, purpose: "login verification" });

module.exports = { generateOTP, verifyOTP, sendPhoneVerificationOTP, sendPasswordResetOTP, sendLoginOTP, normalizeGhanaPhone };
