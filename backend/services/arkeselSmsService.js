require("dotenv").config();

const ARKESEL_API_KEY = process.env.ARKESEL_API_KEY || process.env.ARKESEL_MAIN_API_KEY;
const ARKESEL_SMS_BASE_URL = (process.env.ARKESEL_SMS_BASE_URL || "https://sms.arkesel.com/api/v2/sms").replace(/\/+$/, "");
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || "POLISYNC";
const REQUEST_TIMEOUT_MS = 15000;

function normalizeGhanaPhone(phone) {
  if (!phone) return null;
  let value = String(phone).trim().replace(/[\s()-]/g, "");
  if (/^0\d{9}$/.test(value)) value = `233${value.slice(1)}`;
  if (/^\+233\d{9}$/.test(value)) value = value.slice(1);
  if (!/^233\d{9}$/.test(value)) return null;
  return `+${value}`;
}

function timeoutSignal() {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  return controller.signal;
}

async function parseResponse(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();
  const text = await response.text();
  try { return JSON.parse(text); } catch { return { message: text }; }
}

async function sendSms({ phone, message }) {
  if (!ARKESEL_API_KEY) throw new Error("ARKESEL_API_KEY is not configured.");
  if (!SMS_SENDER_ID || SMS_SENDER_ID.length > 11) throw new Error("SMS_SENDER_ID must be 1-11 characters.");
  const recipient = normalizeGhanaPhone(phone);
  if (!recipient) throw new Error("Invalid Ghana phone number.");
  if (!message || String(message).trim().length === 0) throw new Error("SMS message is required.");

  const response = await fetch(`${ARKESEL_SMS_BASE_URL}/send`, {
    method: "POST",
    headers: {
      "api-key": ARKESEL_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: SMS_SENDER_ID,
      message: String(message).trim(),
      recipients: [recipient],
    }),
    signal: timeoutSignal(),
  });

  const data = await parseResponse(response);
  const success = response.ok && (data?.status === "success" || data?.code === "1000" || data?.code === 1000);
  if (!success) {
    const error = new Error(data?.message || data?.error || `Arkesel SMS request failed (${response.status}).`);
    error.provider = "arkesel";
    error.providerCode = data?.code ? String(data.code) : String(response.status);
    error.providerResponse = data;
    error.httpStatus = response.status;
    throw error;
  }

  return { success: true, provider: "arkesel", recipient, senderId: SMS_SENDER_ID, response: data };
}

module.exports = { sendSms, normalizeGhanaPhone };
