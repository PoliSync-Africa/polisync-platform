// ============================================================
// POLISYNC AFRICA — SMS MESSAGE TEMPLATES
// ============================================================
//
// Centralized SMS templates for the entire platform.
//
// IMPORTANT:
// - This file contains message templates only.
// - No API keys belong here.
// - No Arkesel connection logic belongs here.
// - Personal information is inserted by the notification service.
// - OTP placeholders are preserved for Arkesel.
//
// Supported variables include:
//
// {{firstName}}
// {{otpCode}}
// {{expiry}}
// {{reason}}
// {{resultReference}}
// {{electionName}}
// {{pollingStation}}
// {{constituency}}
// {{date}}
// {{time}}
//
// ============================================================

const SMS_TEMPLATES = {
  // ==========================================================
  // AUTHENTICATION / SECURITY
  // ==========================================================

  PHONE_VERIFICATION: {
    name: "Phone Verification",

    template:
      "Hello {{firstName}}, your PoliSync Africa phone verification code is {{otpCode}}. It expires in {{expiry}} minutes. Do not share this code.",
  },

  PASSWORD_RESET: {
    name: "Password Reset",

    template:
      "Hello {{firstName}}, your PoliSync Africa password reset code is {{otpCode}}. It expires in {{expiry}} minutes. Do not share this code.",
  },

  LOGIN_VERIFICATION: {
    name: "Login Verification",

    template:
      "Hello {{firstName}}, your PoliSync Africa login verification code is {{otpCode}}. It expires in {{expiry}} minutes. Do not share this code.",
  },

  TWO_FACTOR_AUTHENTICATION: {
    name: "Two-Factor Authentication",

    template:
      "Hello {{firstName}}, your PoliSync Africa security code is {{otpCode}}. It expires in {{expiry}} minutes. Do not share this code.",
  },

  PASSWORD_CHANGED: {
    name: "Password Changed",

    template:
      "Hello {{firstName}}, your PoliSync Africa password was successfully changed. If you did not make this change, secure your account immediately.",
  },

  NEW_LOGIN: {
    name: "New Login Alert",

    template:
      "Hello {{firstName}}, a new login was detected on your PoliSync Africa account. If this was not you, secure your account immediately.",
  },

  // ==========================================================
  // ACCOUNT STATUS
  // ==========================================================

  ACCOUNT_PENDING: {
    name: "Account Pending",

    template:
      "Hello {{firstName}}, your PoliSync Africa account registration is pending approval. You will receive another SMS when a decision has been made.",
  },

  ACCOUNT_APPROVED: {
    name: "Account Approved",

    template:
      "Hello {{firstName}}, your PoliSync Africa account has been approved. You can now sign in and access the platform.",
  },

  ACCOUNT_REJECTED: {
    name: "Account Rejected",

    template:
      "Hello {{firstName}}, your PoliSync Africa account registration has been rejected. Reason: {{reason}}. If you believe this decision was made in error, please contact PoliSync Africa support.",
  },

  ACCOUNT_SUSPENDED: {
    name: "Account Suspended",

    template:
      "Hello {{firstName}}, your PoliSync Africa account has been suspended. Reason: {{reason}}. Please contact PoliSync Africa support for assistance.",
  },

  ACCOUNT_REACTIVATED: {
    name: "Account Reactivated",

    template:
      "Hello {{firstName}}, your PoliSync Africa account has been reactivated. You can now sign in and access the platform.",
  },

  ACCOUNT_DEACTIVATED: {
    name: "Account Deactivated",

    template:
      "Hello {{firstName}}, your PoliSync Africa account has been deactivated. Please contact PoliSync Africa support for assistance.",
  },

  // ==========================================================
  // VERIFICATION BADGE
  // ==========================================================

  VERIFICATION_APPROVED: {
    name: "Verification Approved",

    template:
      "Hello {{firstName}}, your PoliSync Africa verification request has been approved. Your verified badge is now active.",
  },

  VERIFICATION_REJECTED: {
    name: "Verification Rejected",

    template:
      "Hello {{firstName}}, your PoliSync Africa verification request was not approved. Reason: {{reason}}. Please contact PoliSync Africa support if you need assistance.",
  },

  PHONE_VERIFIED: {
    name: "Phone Verified",

    template:
      "Hello {{firstName}}, your phone number has been successfully verified on PoliSync Africa.",
  },

  EMAIL_VERIFIED: {
    name: "Email Verified",

    template:
      "Hello {{firstName}}, your email address has been successfully verified on PoliSync Africa.",
  },

  // ==========================================================
  // ELECTION RESULTS
  // ==========================================================

  RESULT_RECEIVED: {
    name: "Election Result Received",

    template:
      "Hello {{firstName}}, your election result has been received successfully by PoliSync Africa. Reference: {{resultReference}}.",
  },

  RESULT_SUBMISSION_FAILED: {
    name: "Election Result Submission Failed",

    template:
      "Hello {{firstName}}, your election result submission could not be completed. Please try again. Reference: {{resultReference}}.",
  },

  RESULT_SUBMISSION_RETRY: {
    name: "Election Result Submission Retry",

    template:
      "Hello {{firstName}}, your previous election result submission was unsuccessful. Please try submitting the result again. Reference: {{resultReference}}.",
  },

  // ==========================================================
  // POLLING AGENT
  // ==========================================================

  POLLING_AGENT_APPROVED: {
    name: "Polling Agent Approved",

    template:
      "Hello {{firstName}}, you have been approved as a polling agent on PoliSync Africa for {{pollingStation}}, {{constituency}}.",
  },

  POLLING_AGENT_REJECTED: {
    name: "Polling Agent Rejected",

    template:
      "Hello {{firstName}}, your polling agent request for {{pollingStation}}, {{constituency}} was not approved. Reason: {{reason}}.",
  },

  POLLING_AGENT_ASSIGNMENT: {
    name: "Polling Agent Assignment",

    template:
      "Hello {{firstName}}, you have been assigned as a polling agent for {{pollingStation}}, {{constituency}} on PoliSync Africa.",
  },

  // ==========================================================
  // ORGANIZATION
  // ==========================================================

  ORGANIZATION_INVITATION: {
    name: "Organization Invitation",

    template:
      "Hello {{firstName}}, you have been invited to join {{organizationName}} on PoliSync Africa. Please review the invitation in your account.",
  },

  ORGANIZATION_MEMBERSHIP_APPROVED: {
    name: "Organization Membership Approved",

    template:
      "Hello {{firstName}}, your membership request to {{organizationName}} on PoliSync Africa has been approved.",
  },

  ORGANIZATION_MEMBERSHIP_REJECTED: {
    name: "Organization Membership Rejected",

    template:
      "Hello {{firstName}}, your membership request to {{organizationName}} on PoliSync Africa was not approved. Reason: {{reason}}.",
  },

  // ==========================================================
  // GENERAL PLATFORM NOTICES
  // ==========================================================

  IMPORTANT_NOTICE: {
    name: "Important Notice",

    template:
      "Hello {{firstName}}, PoliSync Africa has an important notice for you. Please check your account for more information.",
  },

  SUPPORT_RESPONSE: {
    name: "Support Response",

    template:
      "Hello {{firstName}}, PoliSync Africa Support has responded to your request. Please check your account for details.",
  },

  // ==========================================================
  // EXPORT
  // ==========================================================
};

module.exports = SMS_TEMPLATES;
