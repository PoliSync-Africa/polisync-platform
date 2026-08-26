const emailService = require("./emailService");
const smsService = require("./smsService");

// ============================================================
// POLISYNC AFRICA NOTIFICATION SERVICE
// ============================================================
//
// Central notification layer for the entire platform.
//
// Controllers should call this service instead of communicating
// directly with Arkesel, Brevo, or another provider.
//
// This allows us to change providers later without rewriting
// authentication, verification, messaging, organization,
// candidate, election, or administration controllers.
// ============================================================

// ============================================================
// CHANNEL TYPES
// ============================================================

const CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
};

// ============================================================
// NOTIFICATION EVENTS
// ============================================================

const EVENTS = {
  EMAIL_VERIFICATION:
    "email_verification",

  PHONE_VERIFICATION:
    "phone_verification",

  PASSWORD_RESET:
    "password_reset",

  PASSWORD_CHANGED:
    "password_changed",

  LOGIN_ALERT:
    "login_alert",

  ACCOUNT_APPROVED:
    "account_approved",

  ACCOUNT_REJECTED:
    "account_rejected",

  ACCOUNT_SUSPENDED:
    "account_suspended",

  VERIFICATION_REQUESTED:
    "verification_requested",

  VERIFICATION_APPROVED:
    "verification_approved",

  VERIFICATION_REJECTED:
    "verification_rejected",

  VERIFICATION_REVOKED:
    "verification_revoked",

  ORGANIZATION_INVITATION:
    "organization_invitation",

  MESSAGE_RECEIVED:
    "message_received",

  SECURITY_ALERT:
    "security_alert",

  IMPORTANT_NOTICE:
    "important_notice",
};

// ============================================================
// SAFE VALUE
// ============================================================

const safeString = (value) => {
  if (
    value === null ||
    typeof value === "undefined"
  ) {
    return "";
  }

  return String(value).trim();
};

// ============================================================
// SEND EMAIL
// ============================================================

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  event,
}) => {
  if (!to) {
    return {
      success: false,
      channel: CHANNELS.EMAIL,
      event,
      message:
        "Email recipient is missing.",
    };
  }

  try {
    const result =
      await emailService.sendEmail({
        to: safeString(to),
        subject:
          safeString(subject),
        html:
          safeString(html),
        text:
          safeString(text),
        event,
      });

    return {
      success: true,
      channel: CHANNELS.EMAIL,
      event,
      result,
    };
  } catch (error) {
    console.error(
      "PoliSync email notification error:",
      error
    );

    return {
      success: false,
      channel: CHANNELS.EMAIL,
      event,
      message:
        error.message ||
        "Email notification failed.",
    };
  }
};

// ============================================================
// SEND SMS
// ============================================================

const sendSMS = async ({
  to,
  message,
  event,
}) => {
  if (!to) {
    return {
      success: false,
      channel: CHANNELS.SMS,
      event,
      message:
        "SMS recipient is missing.",
    };
  }

  try {
    const result =
      await smsService.sendSMS({
        to: safeString(to),
        message:
          safeString(message),
        event,
      });

    return {
      success: true,
      channel: CHANNELS.SMS,
      event,
      result,
    };
  } catch (error) {
    console.error(
      "PoliSync SMS notification error:",
      error
    );

    return {
      success: false,
      channel: CHANNELS.SMS,
      event,
      message:
        error.message ||
        "SMS notification failed.",
    };
  }
};

// ============================================================
// SEND EMAIL + SMS
// ============================================================

const sendMultiChannel = async ({
  user,
  event,
  emailSubject,
  emailHtml,
  emailText,
  smsMessage,
  sendEmailNotification = true,
  sendSMSNotification = true,
}) => {
  const results = [];

  if (
    sendEmailNotification &&
    user?.email
  ) {
    results.push(
      await sendEmail({
        to: user.email,
        subject:
          emailSubject,
        html:
          emailHtml,
        text:
          emailText,
        event,
      })
    );
  }

  if (
    sendSMSNotification &&
    user?.phone
  ) {
    results.push(
      await sendSMS({
        to: user.phone,
        message:
          smsMessage,
        event,
      })
    );
  }

  return {
    success:
      results.some(
        (result) =>
          result.success
      ),

    event,

    results,
  };
};

// ============================================================
// EMAIL VERIFICATION
// ============================================================

const sendEmailVerification =
  async ({
    user,
    code,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.EMAIL_VERIFICATION,

      emailSubject:
        "Verify your PoliSync Africa email",

      emailHtml: `
        <h2>Verify your PoliSync Africa account</h2>
        <p>Hello ${safeString(
          user?.firstName
        )},</p>
        <p>Your email verification code is:</p>
        <h1>${safeString(
          code
        )}</h1>
        <p>This code should only be used by you.</p>
        <p>If you did not request this code, ignore this message.</p>
      `,

      emailText: `
Verify your PoliSync Africa account.

Your verification code is: ${safeString(
        code
      )}

If you did not request this code, ignore this message.
      `,

      smsMessage:
        `PoliSync Africa email verification code: ${safeString(
          code
        )}. Do not share this code.`,

      sendEmailNotification:
        true,

      sendSMSNotification:
        false,
    });
  };

// ============================================================
// PHONE VERIFICATION
// ============================================================

const sendPhoneVerification =
  async ({
    user,
    code,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.PHONE_VERIFICATION,

      emailSubject:
        "PoliSync Africa phone verification code",

      emailHtml: `
        <h2>Phone verification</h2>
        <p>Your PoliSync Africa phone verification code is:</p>
        <h1>${safeString(
          code
        )}</h1>
      `,

      emailText:
        `Your PoliSync Africa phone verification code is: ${safeString(
          code
        )}`,

      smsMessage:
        `PoliSync Africa phone verification code: ${safeString(
          code
        )}. Do not share this code.`,

      sendEmailNotification:
        false,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// PASSWORD RESET
// ============================================================

const sendPasswordReset =
  async ({
    user,
    code,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.PASSWORD_RESET,

      emailSubject:
        "PoliSync Africa password reset",

      emailHtml: `
        <h2>Password reset request</h2>
        <p>Hello ${safeString(
          user?.firstName
        )},</p>
        <p>Your PoliSync Africa password reset code is:</p>
        <h1>${safeString(
          code
        )}</h1>
        <p>If you did not request a password reset, secure your account immediately.</p>
      `,

      emailText: `
Your PoliSync Africa password reset code is: ${safeString(
        code
      )}

If you did not request this password reset, secure your account immediately.
      `,

      smsMessage:
        `PoliSync Africa password reset code: ${safeString(
          code
        )}. Do not share this code.`,

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// PASSWORD CHANGED
// ============================================================

const sendPasswordChanged =
  async ({
    user,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.PASSWORD_CHANGED,

      emailSubject:
        "Your PoliSync Africa password was changed",

      emailHtml: `
        <h2>Password changed</h2>
        <p>Your PoliSync Africa password has been changed successfully.</p>
        <p>If you did not make this change, contact PoliSync Africa support immediately.</p>
      `,

      emailText:
        "Your PoliSync Africa password has been changed successfully. If you did not make this change, contact PoliSync Africa support immediately.",

      smsMessage:
        "Your PoliSync Africa password was changed. If you did not make this change, secure your account immediately.",

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// ACCOUNT APPROVED
// ============================================================

const sendAccountApproved =
  async ({
    user,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.ACCOUNT_APPROVED,

      emailSubject:
        "Your PoliSync Africa account has been approved",

      emailHtml: `
        <h2>Account approved</h2>
        <p>Hello ${safeString(
          user?.firstName
        )},</p>
        <p>Your PoliSync Africa account has been approved.</p>
      `,

      emailText:
        "Your PoliSync Africa account has been approved.",

      smsMessage:
        "PoliSync Africa: Your account has been approved.",

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// VERIFICATION APPROVED
// ============================================================

const sendVerificationApproved =
  async ({
    user,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.VERIFICATION_APPROVED,

      emailSubject:
        "Your PoliSync Africa account is verified",

      emailHtml: `
        <h2>Verification approved</h2>
        <p>Hello ${safeString(
          user?.firstName
        )},</p>
        <p>Your verification request has been approved by POLISYNC AFRICA.</p>
        <p>Your verified badge is now active.</p>
      `,

      emailText:
        "Your PoliSync Africa verification request has been approved. Your verified badge is now active.",

      smsMessage:
        "PoliSync Africa: Your verification has been approved and your verified badge is now active.",

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// VERIFICATION REJECTED
// ============================================================

const sendVerificationRejected =
  async ({
    user,
    reason,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.VERIFICATION_REJECTED,

      emailSubject:
        "PoliSync Africa verification update",

      emailHtml: `
        <h2>Verification request update</h2>
        <p>Hello ${safeString(
          user?.firstName
        )},</p>
        <p>Your verification request was not approved.</p>
        <p>Reason:</p>
        <p>${safeString(
          reason
        )}</p>
      `,

      emailText:
        `Your PoliSync Africa verification request was not approved. Reason: ${safeString(
          reason
        )}`,

      smsMessage:
        `PoliSync Africa: Your verification request was not approved. Reason: ${safeString(
          reason
        )}`,

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// VERIFICATION REVOKED
// ============================================================

const sendVerificationRevoked =
  async ({
    user,
    reason,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.VERIFICATION_REVOKED,

      emailSubject:
        "Your PoliSync Africa verification was revoked",

      emailHtml: `
        <h2>Verification revoked</h2>
        <p>Hello ${safeString(
          user?.firstName
        )},</p>
        <p>Your PoliSync Africa verified badge has been revoked.</p>
        <p>Reason:</p>
        <p>${safeString(
          reason
        )}</p>
      `,

      emailText:
        `Your PoliSync Africa verified badge has been revoked. Reason: ${safeString(
          reason
        )}`,

      smsMessage:
        `PoliSync Africa: Your verified badge has been revoked. Reason: ${safeString(
          reason
        )}`,

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// SECURITY ALERT
// ============================================================

const sendSecurityAlert =
  async ({
    user,
    message,
  }) => {
    return sendMultiChannel({
      user,

      event:
        EVENTS.SECURITY_ALERT,

      emailSubject:
        "PoliSync Africa security alert",

      emailHtml: `
        <h2>Security Alert</h2>
        <p>${safeString(
          message
        )}</p>
      `,

      emailText:
        safeString(message),

      smsMessage:
        `PoliSync Africa security alert: ${safeString(
          message
        )}`,

      sendEmailNotification:
        true,

      sendSMSNotification:
        true,
    });
  };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  CHANNELS,
  EVENTS,

  sendEmail,
  sendSMS,
  sendMultiChannel,

  sendEmailVerification,
  sendPhoneVerification,
  sendPasswordReset,
  sendPasswordChanged,

  sendAccountApproved,

  sendVerificationApproved,
  sendVerificationRejected,
  sendVerificationRevoked,

  sendSecurityAlert,
};
