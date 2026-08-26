require("dotenv").config();

// ============================================================
// POLISYNC AFRICA — CENTRAL NOTIFICATION SERVICE
// ============================================================
//
// Responsibilities:
//
// - Central SMS dispatcher
// - Arkesel ordinary SMS
// - Arkesel OTP
// - Phone verification OTP
// - Password reset OTP
// - Login / 2FA OTP
// - Central SMS templates
// - Account notifications
// - Verification notifications
// - Security notifications
// - Election-result notifications
// - Polling-agent notifications
// - Safe notification delivery
//
// IMPORTANT:
//
// 1. SMS/OTP failures must NOT break the main platform operation.
//
// 2. Arkesel is authoritative for SMS OTP verification.
//
// 3. PoliSync NEVER marks phoneVerified = true unless
//    Arkesel confirms the OTP.
//
// 4. SMS personalization uses FIRST NAME ONLY.
//
// 5. No OTP is logged.
//
// 6. No OTP is stored by this service.
//
// 7. Do not create a second SMS/OTP provider inside controllers.
// ============================================================

// ============================================================
// SERVICES
// ============================================================

const {
  createSMS,
} = require("./smsTemplateService");

const {
  generateOTP,
  verifyOTP,
  sendPhoneVerificationOTP,
  sendPasswordResetOTP,
  sendLoginOTP,
} = require("./arkeselOtpService");

// ============================================================
// CONFIGURATION
// ============================================================

const ARKESEL_API_KEY =
  process.env.ARKESEL_API_KEY;

const ARKESEL_SMS_API_URL =
  process.env.ARKESEL_API_URL ||
  "https://sms.arkesel.com/api/v2/sms/send";

const SMS_SENDER_ID =
  process.env.SMS_SENDER_ID ||
  "POLISYNC";

const SMS_REQUEST_TIMEOUT_MS =
  Number(
    process.env.SMS_REQUEST_TIMEOUT_MS
  ) || 15000;

// ============================================================
// SMS PRIORITIES
// ============================================================

const SMS_PRIORITY = {
  CRITICAL: "critical",
  HIGH: "high",
  NORMAL: "normal",
  LOW: "low",
  ELECTION_RESULT_FAILURE:
    "election_result_failure",
};

// ============================================================
// FIRST NAME
// ============================================================
//
// Always use first name only in SMS.
//
// Example:
//
// Daniel Amo Nyamekye
//
// SMS:
//
// Hello Daniel,
//
// ============================================================

const getFirstName = (
  userOrFirstName
) => {
  if (
    typeof userOrFirstName ===
    "string"
  ) {
    return (
      userOrFirstName
        .trim()
        .split(/\s+/)[0] ||
      "User"
    );
  }

  return (
    String(
      userOrFirstName?.firstName ||
      ""
    )
      .trim()
      .split(/\s+/)[0] ||
    "User"
  );
};

// ============================================================
// PHONE NORMALIZATION
// ============================================================

const normalizePhone = (
  phone
) => {
  if (!phone) {
    return null;
  }

  let normalized =
    String(phone)
      .trim()
      .replace(/\s+/g, "");

  // Ghana local format
  // 0241234567
  if (
    /^0\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "+233" +
      normalized.slice(1);
  }

  // Ghana international format
  // 233241234567
  if (
    /^233\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "+" +
      normalized;
  }

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
// VALIDATE SMS CONFIGURATION
// ============================================================

const validateSMSConfiguration =
  () => {
    if (!ARKESEL_API_KEY) {
      throw new Error(
        "ARKESEL_API_KEY is not configured."
      );
    }

    if (!ARKESEL_SMS_API_URL) {
      throw new Error(
        "ARKESEL_API_URL is not configured."
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
        SMS_REQUEST_TIMEOUT_MS
      );
    }

    const controller =
      new AbortController();

    setTimeout(
      () => {
        controller.abort();
      },
      SMS_REQUEST_TIMEOUT_MS
    );

    return controller.signal;
  };

// ============================================================
// PARSE PROVIDER RESPONSE
// ============================================================

const parseProviderResponse =
  async (
    response
  ) => {
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
// SEND ORDINARY SMS THROUGH ARKESEL
// ============================================================
//
// This is NOT OTP.
//
// OTP must go through arkeselOtpService.js.
//
// ============================================================

const sendSMS = async ({
  to,
  message,
  priority =
    SMS_PRIORITY.NORMAL,
  event = "general",
}) => {
  const phone =
    normalizePhone(to);

  if (!phone) {
    throw new Error(
      "A valid Ghana phone number is required."
    );
  }

  if (
    !message ||
    !String(message).trim()
  ) {
    throw new Error(
      "SMS message is required."
    );
  }

  validateSMSConfiguration();

  let response;

  try {
    response =
      await fetch(
        ARKESEL_SMS_API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            "api-key":
              ARKESEL_API_KEY,
          },

          body:
            JSON.stringify({
              sender:
                SMS_SENDER_ID,

              message:
                String(
                  message
                ).trim(),

              recipients: [
                phone,
              ],
            }),

          signal:
            createTimeoutSignal(),
        }
      );
  } catch (error) {
    if (
      error?.name ===
      "AbortError"
    ) {
      const timeoutError =
        new Error(
          "Arkesel SMS request timed out."
        );

      timeoutError.provider =
        "arkesel";

      timeoutError.providerCode =
        "TIMEOUT";

      throw timeoutError;
    }

    const networkError =
      new Error(
        `Unable to connect to Arkesel SMS service: ${
          error?.message ||
          "network error"
        }`
      );

    networkError.provider =
      "arkesel";

    networkError.providerCode =
      "NETWORK_ERROR";

    throw networkError;
  }

  const data =
    await parseProviderResponse(
      response
    );

  if (!response.ok) {
    const providerError =
      new Error(
        data?.message ||
          data?.error ||
          `Arkesel returned HTTP ${response.status}.`
      );

    providerError.provider =
      "arkesel";

    providerError.httpStatus =
      response.status;

    providerError.providerResponse =
      data;

    providerError.providerCode =
      data?.code ||
      data?.errorCode ||
      null;

    throw providerError;
  }

  return {
    success: true,

    provider:
      "arkesel",

    event,

    priority,

    recipient:
      phone,

    sender:
      SMS_SENDER_ID,

    response:
      data,

    httpStatus:
      response.status,
  };
};

// ============================================================
// SEND TEMPLATE SMS
// ============================================================

const sendTemplateSMS =
  async ({
    templateKey,
    to,
    data = {},
    priority =
      SMS_PRIORITY.NORMAL,
    event = templateKey,
  }) => {
    const rendered =
      createSMS(
        templateKey,
        {
          ...data,

          firstName:
            getFirstName(
              data.firstName
            ),
        }
      );

    return sendSMS({
      to,

      message:
        rendered.message,

      priority,

      event,
    });
  };

// ============================================================
// SAFE SMS DELIVERY
// ============================================================
//
// SMS failure NEVER breaks the main operation.
//
// ============================================================

const sendSafely =
  async ({
    to,
    message,
    priority =
      SMS_PRIORITY.NORMAL,
    event = "general",
  }) => {
    try {
      const result =
        await sendSMS({
          to,
          message,
          priority,
          event,
        });

      return {
        success: true,

        delivered: true,

        failed: false,

        ...result,
      };
    } catch (error) {
      console.error(
        "PoliSync SMS notification failed:",
        {
          event,

          priority,

          provider:
            error?.provider ||
            "arkesel",

          providerCode:
            error?.providerCode ||
            null,

          httpStatus:
            error?.httpStatus ||
            null,

          error:
            error?.message ||
            "Unknown SMS error",
        }
      );

      return {
        success: false,

        delivered: false,

        failed: true,

        event,

        priority,

        error:
          error?.message ||
          "SMS delivery failed.",

        provider:
          error?.provider ||
          "arkesel",

        providerCode:
          error?.providerCode ||
          null,

        httpStatus:
          error?.httpStatus ||
          null,
      };
    }
  };

// ============================================================
// SAFE TEMPLATE SMS
// ============================================================

const sendTemplateSafely =
  async ({
    templateKey,
    to,
    data = {},
    priority =
      SMS_PRIORITY.NORMAL,
    event = templateKey,
  }) => {
    try {
      const rendered =
        createSMS(
          templateKey,
          {
            ...data,

            firstName:
              getFirstName(
                data.firstName
              ),
          }
        );

      return sendSafely({
        to,

        message:
          rendered.message,

        priority,

        event,
      });
    } catch (error) {
      console.error(
        "PoliSync SMS template failed:",
        {
          templateKey,

          error:
            error?.message ||
            "Template rendering failed.",
        }
      );

      return {
        success: false,

        delivered: false,

        failed: true,

        event,

        priority,

        templateKey,

        error:
          error?.message ||
          "SMS template failed.",
      };
    }
  };

// ============================================================
// PHONE VERIFICATION OTP
// ============================================================
//
// Arkesel generates and sends the OTP.
//
// PoliSync does NOT generate or store this OTP.
//
// ============================================================

const sendPhoneVerification =
  async ({
    phone,
    firstName,
  }) => {
    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return {
        success: false,

        delivered: false,

        failed: true,

        provider:
          "arkesel",

        error:
          "A valid Ghana phone number is required.",
      };
    }

    try {
      return await sendPhoneVerificationOTP(
        {
          phone:
            normalizedPhone,

          firstName:
            getFirstName(
              firstName
            ),
        }
      );
    } catch (error) {
      console.error(
        "Arkesel phone verification OTP failed:",
        {
          provider:
            "arkesel",

          error:
            error?.message ||
            "OTP request failed.",
        }
      );

      return {
        success: false,

        delivered: false,

        failed: true,

        provider:
          "arkesel",

        providerCode:
          error?.providerCode ||
          null,

        error:
          error?.message ||
          "Unable to send phone verification OTP.",
      };
    }
  };

// ============================================================
// PASSWORD RESET OTP
// ============================================================
//
// Kept compatible with both:
//
// sendPasswordReset({
//   phone,
//   firstName
// })
//
// and:
//
// sendPasswordReset({
//   user
// })
//
// ============================================================

const sendPasswordReset =
  async ({
    phone,
    firstName,
    user,
  }) => {
    const targetPhone =
      phone ||
      user?.phone;

    const targetFirstName =
      firstName ||
      user?.firstName;

    const normalizedPhone =
      normalizePhone(
        targetPhone
      );

    if (!normalizedPhone) {
      return {
        success: false,

        delivered: false,

        failed: true,

        provider:
          "arkesel",

        error:
          "A valid Ghana phone number is required.",
      };
    }

    try {
      return await sendPasswordResetOTP(
        {
          phone:
            normalizedPhone,

          firstName:
            getFirstName(
              targetFirstName
            ),
        }
      );
    } catch (error) {
      console.error(
        "Arkesel password reset OTP failed:",
        {
          provider:
            "arkesel",

          error:
            error?.message ||
            "OTP request failed.",
        }
      );

      return {
        success: false,

        delivered: false,

        failed: true,

        provider:
          "arkesel",

        providerCode:
          error?.providerCode ||
          null,

        error:
          error?.message ||
          "Unable to send password reset OTP.",
      };
    }
  };

// ============================================================
// LOGIN / 2FA OTP
// ============================================================

const sendLoginVerification =
  async ({
    phone,
    firstName,
    user,
  }) => {
    const targetPhone =
      phone ||
      user?.phone;

    const targetFirstName =
      firstName ||
      user?.firstName;

    const normalizedPhone =
      normalizePhone(
        targetPhone
      );

    if (!normalizedPhone) {
      return {
        success: false,

        delivered: false,

        failed: true,

        provider:
          "arkesel",

        error:
          "A valid Ghana phone number is required.",
      };
    }

    try {
      return await sendLoginOTP(
        {
          phone:
            normalizedPhone,

          firstName:
            getFirstName(
              targetFirstName
            ),
        }
      );
    } catch (error) {
      console.error(
        "Arkesel login OTP failed:",
        {
          provider:
            "arkesel",

          error:
            error?.message ||
            "OTP request failed.",
        }
      );

      return {
        success: false,

        delivered: false,

        failed: true,

        provider:
          "arkesel",

        providerCode:
          error?.providerCode ||
          null,

        error:
          error?.message ||
          "Unable to send login OTP.",
      };
    }
  };

// ============================================================
// VERIFY ARKESEL OTP
// ============================================================
//
// IMPORTANT:
//
// Only Arkesel can confirm the SMS OTP.
//
// ============================================================

const verifySMSOTP =
  async ({
    phone,
    code,
  }) => {
    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return {
        success: false,

        verified: false,

        provider:
          "arkesel",

        message:
          "A valid Ghana phone number is required.",
      };
    }

    const normalizedCode =
      String(code || "").trim();

    if (
      !/^\d{4,15}$/.test(
        normalizedCode
      )
    ) {
      return {
        success: false,

        verified: false,

        provider:
          "arkesel",

        message:
          "Invalid OTP format.",
      };
    }

    try {
      const result =
        await verifyOTP({
          phone:
            normalizedPhone,

          code:
            normalizedCode,
        });

      return {
        success:
          Boolean(
            result?.success
          ),

        verified:
          Boolean(
            result?.verified
          ),

        provider:
          "arkesel",

        message:
          result?.message ||
          (
            result?.verified
              ? "OTP verified successfully."
              : "Invalid or expired OTP."
          ),

        providerCode:
          result?.providerCode ||
          null,
      };
    } catch (error) {
      console.error(
        "Arkesel OTP verification failed:",
        {
          provider:
            "arkesel",

          error:
            error?.message ||
            "OTP verification failed.",
        }
      );

      return {
        success: false,

        verified: false,

        provider:
          "arkesel",

        providerCode:
          error?.providerCode ||
          null,

        message:
          error?.message ||
          "Unable to verify OTP right now.",
      };
    }
  };

// ============================================================
// ACCOUNT STATUS SMS
// ============================================================

const sendAccountPending =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "ACCOUNT_PENDING",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.NORMAL,

      event:
        "account_pending",
    });

const sendAccountApproved =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "ACCOUNT_APPROVED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_approved",
    });

const sendAccountRejected =
  async ({
    user,
    reason,
  }) =>
    sendTemplateSafely({
      templateKey:
        "ACCOUNT_REJECTED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_rejected",
    });

const sendAccountSuspended =
  async ({
    user,
    reason,
  }) =>
    sendTemplateSafely({
      templateKey:
        "ACCOUNT_SUSPENDED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_suspended",
    });

const sendAccountReactivated =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "ACCOUNT_REACTIVATED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_reactivated",
    });

const sendAccountDeactivated =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "ACCOUNT_DEACTIVATED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_deactivated",
    });

// ============================================================
// VERIFICATION BADGE SMS
// ============================================================

const sendVerificationApproved =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "VERIFICATION_APPROVED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "verification_approved",
    });

const sendVerificationRejected =
  async ({
    user,
    reason,
  }) =>
    sendTemplateSafely({
      templateKey:
        "VERIFICATION_REJECTED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "verification_rejected",
    });

// ============================================================
// PASSWORD / SECURITY ALERTS
// ============================================================

const sendPasswordChanged =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "PASSWORD_CHANGED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.CRITICAL,

      event:
        "password_changed",
    });

const sendNewLoginAlert =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "NEW_LOGIN",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.CRITICAL,

      event:
        "new_login",
    });

// ============================================================
// ELECTION RESULT SMS
// ============================================================

const sendResultReceived =
  async ({
    user,
    resultReference,
  }) =>
    sendTemplateSafely({
      templateKey:
        "RESULT_RECEIVED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        resultReference:
          resultReference ||
          "N/A",
      },

      priority:
        SMS_PRIORITY.NORMAL,

      event:
        "result_received",
    });

const sendResultSubmissionFailed =
  async ({
    user,
    resultReference,
  }) =>
    sendTemplateSafely({
      templateKey:
        "RESULT_SUBMISSION_FAILED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        resultReference:
          resultReference ||
          "N/A",
      },

      priority:
        SMS_PRIORITY.ELECTION_RESULT_FAILURE,

      event:
        "result_submission_failed",
    });

// ============================================================
// POLLING AGENT SMS
// ============================================================

const sendPollingAgentApproved =
  async ({
    user,
    pollingStation,
    constituency,
  }) =>
    sendTemplateSafely({
      templateKey:
        "POLLING_AGENT_APPROVED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        pollingStation:
          pollingStation ||
          "your assigned polling station",

        constituency:
          constituency ||
          "your constituency",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "polling_agent_approved",
    });

const sendPollingAgentRejected =
  async ({
    user,
    pollingStation,
    constituency,
    reason,
  }) =>
    sendTemplateSafely({
      templateKey:
        "POLLING_AGENT_REJECTED",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        pollingStation:
          pollingStation ||
          "your assigned polling station",

        constituency:
          constituency ||
          "your constituency",

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "polling_agent_rejected",
    });

const sendPollingAgentAssignment =
  async ({
    user,
    pollingStation,
    constituency,
  }) =>
    sendTemplateSafely({
      templateKey:
        "POLLING_AGENT_ASSIGNMENT",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),

        pollingStation:
          pollingStation ||
          "your assigned polling station",

        constituency:
          constituency ||
          "your constituency",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "polling_agent_assignment",
    });

// ============================================================
// GENERAL SMS
// ============================================================

const sendImportantNotice =
  async ({
    user,
  }) =>
    sendTemplateSafely({
      templateKey:
        "IMPORTANT_NOTICE",

      to:
        user.phone,

      data: {
        firstName:
          getFirstName(
            user
          ),
      },

      priority:
        SMS_PRIORITY.NORMAL,

      event:
        "important_notice",
    });

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Core SMS
  sendSMS,
  sendTemplateSMS,
  sendSafely,
  sendTemplateSafely,

  // OTP
  sendPhoneVerification,
  sendPasswordReset,
  sendLoginVerification,
  verifySMSOTP,
  generateOTP,
  verifyOTP,

  // Account
  sendAccountPending,
  sendAccountApproved,
  sendAccountRejected,
  sendAccountSuspended,
  sendAccountReactivated,
  sendAccountDeactivated,

  // Verification
  sendVerificationApproved,
  sendVerificationRejected,

  // Security
  sendPasswordChanged,
  sendNewLoginAlert,

  // Election results
  sendResultReceived,
  sendResultSubmissionFailed,

  // Polling agents
  sendPollingAgentApproved,
  sendPollingAgentRejected,
  sendPollingAgentAssignment,

  // General
  sendImportantNotice,

  // Constants
  SMS_PRIORITY,
};
