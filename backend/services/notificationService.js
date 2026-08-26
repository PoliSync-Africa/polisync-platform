require("dotenv").config();

// ============================================================
// POLISYNC AFRICA — CENTRAL SMS NOTIFICATION SERVICE
// ============================================================
//
// This service is the central dispatcher for PoliSync SMS.
//
// Responsibilities:
// - Render centralized SMS templates
// - Send ordinary transactional SMS through Arkesel
// - Send OTP through Arkesel OTP service
// - Personalize messages
// - Protect the main application from SMS failures
// - Provide structured notification results
//
// IMPORTANT:
// SMS failure MUST NOT automatically fail the main platform
// operation that triggered the notification.
//
// Example:
//
// Election result submission
//        |
//        +--> Save result
//        |
//        +--> Attempt SMS
//                 |
//                 +--> SMS succeeds
//                 |
//                 +--> SMS fails
//
// The result operation remains independent from SMS delivery.
//
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

const SMS_REQUEST_TIMEOUT_MS = 15000;

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
// VALIDATE ORDINARY SMS CONFIGURATION
// ============================================================

const validateSMSConfiguration = () => {
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

  // ----------------------------------------------------------
  // Ghana local format
  // 0241234567
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
  // Ghana international format without +
  // ----------------------------------------------------------

  if (
    /^233\d{9}$/.test(
      normalized
    )
  ) {
    normalized =
      "+" +
      normalized;
  }

  // ----------------------------------------------------------
  // Final validation
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
// CREATE TIMEOUT SIGNAL
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
// SEND ORDINARY SMS THROUGH ARKESEL
// ============================================================
//
// This is for non-OTP SMS.
//
// OTP must use arkeselOtpService.js.
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
      throw new Error(
        "Arkesel SMS request timed out."
      );
    }

    throw new Error(
      `Unable to connect to Arkesel SMS service: ${
        error.message ||
        "network error"
      }`
    );
  }

  const data =
    await parseProviderResponse(
      response
    );

  if (!response.ok) {
    const error =
      new Error(
        data?.message ||
          data?.error ||
          `Arkesel returned HTTP ${response.status}.`
      );

    error.provider =
      "arkesel";

    error.httpStatus =
      response.status;

    error.providerResponse =
      data;

    throw error;
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
//
// Example:
//
// sendTemplateSMS({
//   templateKey: "ACCOUNT_APPROVED",
//   to: user.phone,
//   data: {
//     firstName: user.firstName
//   }
// });
//
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
        data
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
// This method is designed for notifications that MUST NOT
// break the primary operation.
//
// Example:
//
// Result saved successfully.
// SMS fails.
// Result still remains successful.
//
// ============================================================

const sendSafely = async ({
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

      delivered:
        true,

      failed:
        false,

      ...result,
    };
  } catch (error) {
    console.error(
      "PoliSync SMS notification failed:",
      {
        event,

        priority,

        error:
          error.message,
      }
    );

    return {
      success: false,

      delivered:
        false,

      failed:
        true,

      event,

      priority,

      error:
        error.message,

      provider:
        error.provider ||
        "arkesel",

      providerCode:
        error.providerCode ||
        null,

      httpStatus:
        error.httpStatus ||
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
          data
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
            error.message,
        }
      );

      return {
        success: false,

        delivered:
          false,

        failed:
          true,

        event,

        priority,

        templateKey,

        error:
          error.message,
      };
    }
  };

// ============================================================
// PHONE VERIFICATION OTP
// ============================================================

const sendPhoneVerification =
  async ({
    phone,
    firstName,
  }) => {
    return sendPhoneVerificationOTP({
      phone,

      firstName,
    });
  };

// ============================================================
// PASSWORD RESET OTP
// ============================================================

const sendPasswordReset =
  async ({
    phone,
    firstName,
  }) => {
    return sendPasswordResetOTP({
      phone,

      firstName,
    });
  };

// ============================================================
// LOGIN / 2FA OTP
// ============================================================

const sendLoginVerification =
  async ({
    phone,
    firstName,
  }) => {
    return sendLoginOTP({
      phone,

      firstName,
    });
  };

// ============================================================
// VERIFY ARKESEL OTP
// ============================================================

const verifySMSOTP =
  async ({
    phone,
    code,
  }) => {
    return verifyOTP({
      phone,

      code,
    });
  };

// ============================================================
// ACCOUNT STATUS SMS
// ============================================================

const sendAccountPending =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "ACCOUNT_PENDING",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.NORMAL,

      event:
        "account_pending",
    });
  };

const sendAccountApproved =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "ACCOUNT_APPROVED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_approved",
    });
  };

const sendAccountRejected =
  async ({
    user,
    reason,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "ACCOUNT_REJECTED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_rejected",
    });
  };

const sendAccountSuspended =
  async ({
    user,
    reason,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "ACCOUNT_SUSPENDED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_suspended",
    });
  };

const sendAccountReactivated =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "ACCOUNT_REACTIVATED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_reactivated",
    });
  };

const sendAccountDeactivated =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "ACCOUNT_DEACTIVATED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "account_deactivated",
    });
  };

// ============================================================
// VERIFICATION BADGE SMS
// ============================================================

const sendVerificationApproved =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "VERIFICATION_APPROVED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "verification_approved",
    });
  };

const sendVerificationRejected =
  async ({
    user,
    reason,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "VERIFICATION_REJECTED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

        reason:
          reason ||
          "No reason was provided.",
      },

      priority:
        SMS_PRIORITY.HIGH,

      event:
        "verification_rejected",
    });
  };

// ============================================================
// PASSWORD / SECURITY ALERTS
// ============================================================

const sendPasswordChanged =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "PASSWORD_CHANGED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.CRITICAL,

      event:
        "password_changed",
    });
  };

const sendNewLoginAlert =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "NEW_LOGIN",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.CRITICAL,

      event:
        "new_login",
    });
  };

// ============================================================
// ELECTION RESULT SMS
// ============================================================
//
// IMPORTANT:
//
// These use sendTemplateSafely().
//
// Therefore, if Arkesel fails, the election result operation
// itself is NOT affected.
//
// ============================================================

const sendResultReceived =
  async ({
    user,
    resultReference,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "RESULT_RECEIVED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

        resultReference:
          resultReference ||
          "N/A",
      },

      priority:
        SMS_PRIORITY.NORMAL,

      event:
        "result_received",
    });
  };

const sendResultSubmissionFailed =
  async ({
    user,
    resultReference,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "RESULT_SUBMISSION_FAILED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

        resultReference:
          resultReference ||
          "N/A",
      },

      priority:
        SMS_PRIORITY.ELECTION_RESULT_FAILURE,

      event:
        "result_submission_failed",
    });
  };

// ============================================================
// POLLING AGENT SMS
// ============================================================

const sendPollingAgentApproved =
  async ({
    user,
    pollingStation,
    constituency,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "POLLING_AGENT_APPROVED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

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
  };

const sendPollingAgentRejected =
  async ({
    user,
    pollingStation,
    constituency,
    reason,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "POLLING_AGENT_REJECTED",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

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
  };

const sendPollingAgentAssignment =
  async ({
    user,
    pollingStation,
    constituency,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "POLLING_AGENT_ASSIGNMENT",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,

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
  };

// ============================================================
// GENERAL SMS
// ============================================================

const sendImportantNotice =
  async ({
    user,
  }) => {
    return sendTemplateSafely({
      templateKey:
        "IMPORTANT_NOTICE",

      to:
        user.phone,

      data: {
        firstName:
          user.firstName,
      },

      priority:
        SMS_PRIORITY.NORMAL,

      event:
        "important_notice",
    });
  };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  // ----------------------------------------------------------
  // Core SMS
  // ----------------------------------------------------------

  sendSMS,

  sendTemplateSMS,

  sendSafely,

  sendTemplateSafely,

  // ----------------------------------------------------------
  // OTP
  // ----------------------------------------------------------

  sendPhoneVerification,

  sendPasswordReset,

  sendLoginVerification,

  verifySMSOTP,

  generateOTP,

  verifyOTP,

  // ----------------------------------------------------------
  // Account
  // ----------------------------------------------------------

  sendAccountPending,

  sendAccountApproved,

  sendAccountRejected,

  sendAccountSuspended,

  sendAccountReactivated,

  sendAccountDeactivated,

  // ----------------------------------------------------------
  // Verification
  // ----------------------------------------------------------

  sendVerificationApproved,

  sendVerificationRejected,

  // ----------------------------------------------------------
  // Security
  // ----------------------------------------------------------

  sendPasswordChanged,

  sendNewLoginAlert,

  // ----------------------------------------------------------
  // Election results
  // ----------------------------------------------------------

  sendResultReceived,

  sendResultSubmissionFailed,

  // ----------------------------------------------------------
  // Polling agents
  // ----------------------------------------------------------

  sendPollingAgentApproved,

  sendPollingAgentRejected,

  sendPollingAgentAssignment,

  // ----------------------------------------------------------
  // General
  // ----------------------------------------------------------

  sendImportantNotice,

  // ----------------------------------------------------------
  // Constants
  // ----------------------------------------------------------

  SMS_PRIORITY,
};
