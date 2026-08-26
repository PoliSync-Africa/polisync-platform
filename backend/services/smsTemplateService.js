// ============================================================
// POLISYNC AFRICA — SMS TEMPLATE SERVICE
// ============================================================
//
// Central SMS message templates.
//
// IMPORTANT
// ------------------------------------------------------------
// - SMS uses FIRST NAME ONLY.
// - This service does NOT generate OTPs.
// - This service does NOT store OTPs.
// - Arkesel handles OTP generation and delivery.
// - notificationService.js uses createSMS().
// ============================================================

// ============================================================
// FIRST NAME
// ============================================================

const getFirstName = (firstName) => {
  return (
    String(firstName || "")
      .trim()
      .split(/\s+/)[0] ||
    "User"
  );
};

// ============================================================
// TEMPLATE DEFINITIONS
// ============================================================

const templates = {
  // ----------------------------------------------------------
  // ACCOUNT
  // ----------------------------------------------------------

  ACCOUNT_PENDING: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa account has been created and is pending approval.`;
  },

  ACCOUNT_APPROVED: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa account has been approved. You can now access your account.`;
  },

  ACCOUNT_REJECTED: ({
    firstName,
    reason,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa account was not approved. Reason: ${
      reason || "No reason was provided."
    }`;
  },

  ACCOUNT_SUSPENDED: ({
    firstName,
    reason,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa account has been suspended. Reason: ${
      reason || "No reason was provided."
    }`;
  },

  ACCOUNT_REACTIVATED: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa account has been reactivated.`;
  },

  ACCOUNT_DEACTIVATED: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa account has been deactivated.`;
  },

  // ----------------------------------------------------------
  // VERIFICATION
  // ----------------------------------------------------------

  VERIFICATION_APPROVED: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa verification request has been approved.`;
  },

  VERIFICATION_REJECTED: ({
    firstName,
    reason,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa verification request was rejected. Reason: ${
      reason || "No reason was provided."
    }`;
  },

  // ----------------------------------------------------------
  // SECURITY
  // ----------------------------------------------------------

  PASSWORD_CHANGED: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa password has been changed successfully. If you did not make this change, secure your account immediately.`;
  },

  NEW_LOGIN: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, a new login to your PoliSync Africa account was detected. If this was not you, secure your account immediately.`;
  },

  // ----------------------------------------------------------
  // ELECTION RESULTS
  // ----------------------------------------------------------

  RESULT_RECEIVED: ({
    firstName,
    resultReference,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa election result submission has been received. Reference: ${
      resultReference || "N/A"
    }.`;
  },

  RESULT_SUBMISSION_FAILED: ({
    firstName,
    resultReference,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your PoliSync Africa election result submission failed. Reference: ${
      resultReference || "N/A"
    }. Please try again.`;
  },

  // ----------------------------------------------------------
  // POLLING AGENTS
  // ----------------------------------------------------------

  POLLING_AGENT_APPROVED: ({
    firstName,
    pollingStation,
    constituency,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, you have been approved as a polling agent for ${pollingStation || "your assigned polling station"} in ${constituency || "your constituency"}.`;
  },

  POLLING_AGENT_REJECTED: ({
    firstName,
    pollingStation,
    constituency,
    reason,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, your polling agent application for ${pollingStation || "your assigned polling station"} in ${constituency || "your constituency"} was rejected. Reason: ${
      reason || "No reason was provided."
    }`;
  },

  POLLING_AGENT_ASSIGNMENT: ({
    firstName,
    pollingStation,
    constituency,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, you have been assigned as a polling agent at ${pollingStation || "your assigned polling station"} in ${constituency || "your constituency"}.`;
  },

  // ----------------------------------------------------------
  // GENERAL
  // ----------------------------------------------------------

  IMPORTANT_NOTICE: ({
    firstName,
  }) => {
    return `Hello ${getFirstName(
      firstName
    )}, you have an important notification from PoliSync Africa. Please log in to your account for details.`;
  },
};

// ============================================================
// CREATE SMS
// ============================================================

const createSMS = (
  templateKey,
  data = {}
) => {
  const template =
    templates[templateKey];

  if (!template) {
    throw new Error(
      `Unknown SMS template: ${templateKey}`
    );
  }

  const message =
    template({
      ...data,
      firstName:
        getFirstName(
          data.firstName
        ),
    });

  if (
    !message ||
    !String(message).trim()
  ) {
    throw new Error(
      `SMS template "${templateKey}" produced an empty message.`
    );
  }

  return {
    templateKey,
    message: String(message).trim(),
  };
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createSMS,
};
