require("dotenv").config();

// ============================================================
// POLISYNC AFRICA SMS SERVICE
// ============================================================
//
// Provider layer for transactional SMS.
//
// Current provider:
// Arkesel
//
// The rest of PoliSync Africa communicates through this service
// rather than calling Arkesel directly.
//
// This makes it possible to replace Arkesel later without
// rewriting authentication, verification, notifications,
// organizations, messaging, or election services.
// ============================================================

const ARKESEL_API_URL =
  process.env.ARKESEL_API_URL ||
  "https://sms.arkesel.com/api/v2/sms/send";

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const ARKESEL_API_KEY =
  process.env.ARKESEL_API_KEY;

const SMS_SENDER_ID =
  process.env.SMS_SENDER_ID ||
  "POLISYNC";

// ============================================================
// VALIDATION
// ============================================================

const validateConfiguration = () => {
  if (!ARKESEL_API_KEY) {
    throw new Error(
      "ARKESEL_API_KEY is not configured."
    );
  }

  if (!SMS_SENDER_ID) {
    throw new Error(
      "SMS_SENDER_ID is not configured."
    );
  }
};

// ============================================================
// NORMALIZE GHANA PHONE
// ============================================================

const normalizeGhanaPhone = (
  phone
) => {
  if (!phone) {
    return null;
  }

  let normalized =
    String(phone).trim();

  // ----------------------------------------------------------
  // Convert 024XXXXXXX -> +23324XXXXXXX
  // ----------------------------------------------------------

  if (
    /^0\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "+233" +
      normalized.slice(1);
  }

  // ----------------------------------------------------------
  // Convert 23324XXXXXXX -> +23324XXXXXXX
  // ----------------------------------------------------------

  if (
    /^233\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "+" + normalized;
  }

  // ----------------------------------------------------------
  // Validate final Ghana number
  // ----------------------------------------------------------

  if (
    !/^\+233\d{9}$/.test(
      normalized
    )
  ) {
    return null;
  }

  return normalized;
};

// ============================================================
// SEND SMS
// ============================================================

const sendSMS = async ({
  to,
  message,
  event = "transactional",
}) => {
  try {
    validateConfiguration();

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    const phone =
      normalizeGhanaPhone(to);

    if (!phone) {
      throw new Error(
        "A valid Ghana phone number is required."
      );
    }

    // --------------------------------------------------------
    // MESSAGE
    // --------------------------------------------------------

    const smsMessage =
      String(message || "").trim();

    if (!smsMessage) {
      throw new Error(
        "SMS message is required."
      );
    }

    // --------------------------------------------------------
    // ARKESEL REQUEST
    // --------------------------------------------------------

    const response =
      await fetch(
        ARKESEL_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "api-key":
              ARKESEL_API_KEY,
          },

          body: JSON.stringify({
            sender:
              SMS_SENDER_ID,

            message:
              smsMessage,

            recipients: [
              phone,
            ],
          }),
        }
      );

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data;

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();
    } else {
      data =
        await response.text();
    }

    // --------------------------------------------------------
    // FAILED REQUEST
    // --------------------------------------------------------

    if (!response.ok) {
      console.error(
        "Arkesel SMS request failed:",
        {
          status:
            response.status,

          event,

          response:
            data,
        }
      );

      throw new Error(
        `SMS provider returned HTTP ${response.status}.`
      );
    }

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return {
      success: true,

      provider:
        "arkesel",

      event,

      recipient:
        phone,

      response:
        data,
    };
  } catch (error) {
    console.error(
      "PoliSync SMS service error:",
      error
    );

    throw error;
  }
};

// ============================================================
// SEND OTP
// ============================================================

const sendOTP = async ({
  to,
  code,
  purpose = "verification",
}) => {
  const message =
    `POLISYNC AFRICA: Your ${purpose} code is ${String(
      code
    )}. Do not share this code with anyone.`;

  return sendSMS({
    to,
    message,
    event:
      `otp_${purpose}`,
  });
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  sendSMS,
  sendOTP,
  normalizeGhanaPhone,
};
