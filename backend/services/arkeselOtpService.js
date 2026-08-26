require("dotenv").config();

// ============================================================
// POLISYNC AFRICA — ARKESEL OTP SERVICE
// ============================================================
//
// Dedicated Arkesel OTP integration.
//
// Arkesel handles:
// - OTP generation
// - OTP delivery
// - OTP expiration
// - OTP verification
//
// PoliSync Africa handles:
// - User identity
// - Account verification state
// - Account permissions
// - Security decisions
//
// ============================================================

// ============================================================
// CONFIGURATION
// ============================================================

const ARKESEL_API_KEY =
  process.env.ARKESEL_API_KEY;

const ARKESEL_OTP_BASE_URL =
  process.env.ARKESEL_OTP_BASE_URL ||
  "https://sms.arkesel.com/api/otp";

const SMS_SENDER_ID =
  process.env.SMS_SENDER_ID ||
  "POLISYNC";

// ============================================================
// DEFAULT OTP SETTINGS
// ============================================================

const DEFAULT_OTP_EXPIRY = 5;

const DEFAULT_OTP_LENGTH = 6;

const MAX_OTP_LENGTH = 15;

const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// CONFIGURATION VALIDATION
// ============================================================

const validateConfiguration = () => {
  if (!ARKESEL_API_KEY) {
    throw new Error(
      "ARKESEL_API_KEY is not configured."
    );
  }

  if (!ARKESEL_OTP_BASE_URL) {
    throw new Error(
      "ARKESEL_OTP_BASE_URL is not configured."
    );
  }

  if (!SMS_SENDER_ID) {
    throw new Error(
      "SMS_SENDER_ID is not configured."
    );
  }

  if (
    SMS_SENDER_ID.length > 11
  ) {
    throw new Error(
      "SMS_SENDER_ID must not exceed 11 characters."
    );
  }
};

// ============================================================
// NORMALIZE GHANA PHONE NUMBER
// ============================================================

const normalizeGhanaPhone = (
  phone
) => {
  if (!phone) {
    return null;
  }

  let normalized =
    String(phone)
      .trim()
      .replace(/\s+/g, "");

  // ----------------------------------------------------------
  // 0241234567
  // ----------------------------------------------------------

  if (
    /^0\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "233" +
      normalized.slice(1);
  }

  // ----------------------------------------------------------
  // +233241234567
  // ----------------------------------------------------------

  if (
    /^\+233\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      normalized.slice(1);
  }

  // ----------------------------------------------------------
  // FINAL VALIDATION
  // ----------------------------------------------------------

  if (
    !/^233\d{9}$/.test(
      normalized
    )
  ) {
    return null;
  }

  return normalized;
};

// ============================================================
// CREATE REQUEST TIMEOUT
// ============================================================

const createTimeoutSignal =
  () => {
    if (
      typeof AbortSignal !==
        "undefined" &&
      typeof AbortSignal.timeout ===
        "function"
    ) {
      return AbortSignal.timeout(
        REQUEST_TIMEOUT_MS
      );
    }

    const controller =
      new AbortController();

    setTimeout(
      () => {
        controller.abort();
      },
      REQUEST_TIMEOUT_MS
    );

    return controller.signal;
  };

// ============================================================
// PARSE ARKESEL RESPONSE
// ============================================================

const parseResponse =
  async (response) => {
    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      return response.json();
    }

    const text =
      await response.text();

    try {
      return JSON.parse(text);
    } catch {
      return {
        message: text,
      };
    }
  };

// ============================================================
// ARKESEL REQUEST
// ============================================================
//
// IMPORTANT:
// API key is sent through the HTTP header.
// It is NEVER placed in the URL.
//
// ============================================================

const arkeselRequest =
  async (
    endpoint,
    body
  ) => {
    validateConfiguration();

    const baseUrl =
      ARKESEL_OTP_BASE_URL.replace(
        /\/+$/,
        ""
      );

    const url =
      `${baseUrl}/${endpoint}`;

    let response;

    try {
      response =
        await fetch(
          url,
          {
            method: "POST",

            headers: {
              "api-key":
                ARKESEL_API_KEY,

              "Content-Type":
                "application/json",

              Accept:
                "application/json",
            },

            body:
              JSON.stringify(
                body
              ),

            signal:
              createTimeoutSignal(),
          }
        );
    } catch (error) {
      if (
        error?.name ===
        "AbortError"
      ) {
        throw new Error(
          "Arkesel OTP request timed out."
        );
      }

      throw new Error(
        `Unable to connect to Arkesel OTP service: ${
          error.message ||
          "network error"
        }`
      );
    }

    const data =
      await parseResponse(
        response
      );

    return {
      httpStatus:
        response.status,

      ok:
        response.ok,

      data,
    };
  };

// ============================================================
// PERSONALIZED OTP MESSAGE
// ============================================================
//
// The user's first name is inserted here.
//
// Example:
//
// firstName = "Daniel"
//
// Result:
//
// Hello Daniel, your PoliSync Africa phone verification
// code is %otp_code%. It expires in %expiry% minutes.
// Do not share this code.
//
// Arkesel replaces:
// %otp_code% -> actual OTP
// %expiry%   -> expiry time
//
// ============================================================

const buildOTPMessage = ({
  firstName,
  purpose,
  expiry,
}) => {
  const safeFirstName =
    String(
      firstName || "there"
    )
      .trim()
      .replace(
        /[\r\n]+/g,
        " "
      );

  const safePurpose =
    String(
      purpose ||
        "phone verification"
    )
      .trim()
      .replace(
        /[\r\n]+/g,
        " "
      );

  const message =
    `Hello ${safeFirstName}, your PoliSync Africa ${safePurpose} code is %otp_code%. It expires in %expiry% minutes. Do not share this code.`;

  if (
    !message.includes(
      "%otp_code%"
    )
  ) {
    throw new Error(
      "OTP message must contain %otp_code%."
    );
  }

  if (
    !message.includes(
      "%expiry%"
    )
  ) {
    throw new Error(
      "OTP message must contain %expiry%."
    );
  }

  return message;
};

// ============================================================
// GENERATE + SEND OTP
// ============================================================

const generateOTP =
  async ({
    phone,
    firstName,
    expiry =
      DEFAULT_OTP_EXPIRY,
    length =
      DEFAULT_OTP_LENGTH,
    purpose =
      "phone verification",
  }) => {
    validateConfiguration();

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    const number =
      normalizeGhanaPhone(
        phone
      );

    if (!number) {
      throw new Error(
        "Invalid Ghana phone number."
      );
    }

    // --------------------------------------------------------
    // EXPIRY
    // --------------------------------------------------------

    const normalizedExpiry =
      Number(expiry);

    if (
      !Number.isInteger(
        normalizedExpiry
      ) ||
      normalizedExpiry <= 0
    ) {
      throw new Error(
        "OTP expiry must be a positive whole number."
      );
    }

    // --------------------------------------------------------
    // LENGTH
    // --------------------------------------------------------

    const normalizedLength =
      Number(length);

    if (
      !Number.isInteger(
        normalizedLength
      ) ||
      normalizedLength < 4 ||
      normalizedLength >
        MAX_OTP_LENGTH
    ) {
      throw new Error(
        `OTP length must be between 4 and ${MAX_OTP_LENGTH} digits.`
      );
    }

    // --------------------------------------------------------
    // PERSONALIZED MESSAGE
    // --------------------------------------------------------

    const message =
      buildOTPMessage({
        firstName,

        purpose,

        expiry:
          normalizedExpiry,
      });

    // --------------------------------------------------------
    // SEND TO ARKESEL
    // --------------------------------------------------------

    const result =
      await arkeselRequest(
        "generate",
        {
          expiry:
            normalizedExpiry,

          length:
            normalizedLength,

          medium:
            "sms",

          message,

          number,

          sender_id:
            SMS_SENDER_ID,

          type:
            "numeric",
        }
      );

    const {
      httpStatus,
      ok,
      data,
    } = result;

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (
      ok &&
      (
        data?.code ===
          "1000" ||
        data?.code ===
          1000
      )
    ) {
      return {
        success: true,

        provider:
          "arkesel",

        operation:
          "otp_generation",

        number,

        senderId:
          SMS_SENDER_ID,

        expiresInMinutes:
          normalizedExpiry,

        length:
          normalizedLength,

        response:
          data,

        httpStatus,
      };
    }

    // --------------------------------------------------------
    // ERROR
    // --------------------------------------------------------

    const providerCode =
      String(
        data?.code ||
          httpStatus ||
          "UNKNOWN"
      );

    const providerMessage =
      data?.message ||
      data?.error ||
      "Arkesel OTP generation failed.";

    const error =
      new Error(
        providerMessage
      );

    error.provider =
      "arkesel";

    error.providerCode =
      providerCode;

    error.providerResponse =
      data;

    error.httpStatus =
      httpStatus;

    throw error;
  };

// ============================================================
// VERIFY OTP
// ============================================================

const verifyOTP =
  async ({
    phone,
    code,
  }) => {
    validateConfiguration();

    // --------------------------------------------------------
    // PHONE
    // --------------------------------------------------------

    const number =
      normalizeGhanaPhone(
        phone
      );

    if (!number) {
      throw new Error(
        "Invalid Ghana phone number."
      );
    }

    // --------------------------------------------------------
    // OTP CODE
    // --------------------------------------------------------

    const normalizedCode =
      String(
        code || ""
      ).trim();

    if (
      !/^\d{4,15}$/.test(
        normalizedCode
      )
    ) {
      throw new Error(
        "Invalid OTP format."
      );
    }

    // --------------------------------------------------------
    // VERIFY WITH ARKESEL
    // --------------------------------------------------------

    const result =
      await arkeselRequest(
        "verify",
        {
          code:
            normalizedCode,

          number,
        }
      );

    const {
      httpStatus,
      ok,
      data,
    } = result;

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    if (
      ok &&
      (
        data?.code ===
          "1100" ||
        data?.code ===
          1100
      )
    ) {
      return {
        success: true,

        verified: true,

        provider:
          "arkesel",

        operation:
          "otp_verification",

        number,

        response:
          data,

        httpStatus,
      };
    }

    // --------------------------------------------------------
    // FAILED VERIFICATION
    // --------------------------------------------------------

    const providerCode =
      String(
        data?.code ||
          httpStatus ||
          "UNKNOWN"
      );

    const providerMessage =
      data?.message ||
      data?.error ||
      "OTP verification failed.";

    return {
      success: false,

      verified: false,

      provider:
        "arkesel",

      operation:
        "otp_verification",

      providerCode,

      number,

      message:
        providerMessage,

      response:
        data,

      httpStatus,
    };
  };

// ============================================================
// PHONE VERIFICATION OTP
// ============================================================

const sendPhoneVerificationOTP =
  async ({
    phone,
    firstName,
  }) => {
    return generateOTP({
      phone,

      firstName,

      purpose:
        "phone verification",

      expiry:
        DEFAULT_OTP_EXPIRY,

      length:
        DEFAULT_OTP_LENGTH,
    });
  };

// ============================================================
// PASSWORD RESET OTP
// ============================================================

const sendPasswordResetOTP =
  async ({
    phone,
    firstName,
  }) => {
    return generateOTP({
      phone,

      firstName,

      purpose:
        "password reset",

      expiry:
        DEFAULT_OTP_EXPIRY,

      length:
        DEFAULT_OTP_LENGTH,
    });
  };

// ============================================================
// LOGIN / TWO-FACTOR OTP
// ============================================================

const sendLoginOTP =
  async ({
    phone,
    firstName,
  }) => {
    return generateOTP({
      phone,

      firstName,

      purpose:
        "login verification",

      expiry:
        DEFAULT_OTP_EXPIRY,

      length:
        DEFAULT_OTP_LENGTH,
    });
  };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generateOTP,

  verifyOTP,

  sendPhoneVerificationOTP,

  sendPasswordResetOTP,

  sendLoginOTP,

  normalizeGhanaPhone,
};
