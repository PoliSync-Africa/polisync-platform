require("dotenv").config();

// ============================================================
// POLISYNC AFRICA EMAIL SERVICE
// ============================================================
//
// Provider layer for transactional email.
//
// The rest of PoliSync Africa should communicate through this
// service instead of calling Brevo/SMTP directly.
//
// Current provider:
// Brevo HTTP API
//
// This architecture allows us to replace the provider later
// without rewriting authController, verificationController,
// notificationService, or other platform services.
// ============================================================

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const BREVO_API_KEY = process.env.BREVO_API_KEY;

const EMAIL_FROM = process.env.EMAIL_FROM;

const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "POLISYNC AFRICA";

// ============================================================
// VALIDATION
// ============================================================

const validateConfiguration = () => {
  if (!BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  if (!EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured.");
  }
};

// ============================================================
// NORMALIZE RECIPIENT
// ============================================================

const normalizeRecipient = (recipient) => {
  if (!recipient) {
    return null;
  }

  if (typeof recipient === "string") {
    return {
      email: recipient.trim().toLowerCase(),
    };
  }

  if (typeof recipient === "object" && recipient.email) {
    return {
      email: recipient.email.trim().toLowerCase(),

      name: recipient.name?.trim() || undefined,
    };
  }

  return null;
};

// ============================================================
// SEND EMAIL
// ============================================================

const sendEmail = async ({ to, subject, html, text, event = "transactional", }) => {
  try {
    validateConfiguration();

    // --------------------------------------------------------
    // RECIPIENT
    // --------------------------------------------------------

    const recipient = normalizeRecipient(to);

    if (!recipient?.email) {
      throw new Error("A valid email recipient is required.");
    }

    // --------------------------------------------------------
    // SUBJECT
    // --------------------------------------------------------

    if (!subject || !String(subject).trim()) {
      throw new Error("Email subject is required.");
    }

    // --------------------------------------------------------
    // CONTENT
    // --------------------------------------------------------

    const htmlContent =
      html && String(html).trim()
        ? String(html)
        : `<p>${String(text || "")}</p>`;

    const textContent = text && String(text).trim() ? String(text) : undefined;

    // --------------------------------------------------------
    // TIMEOUT
    // --------------------------------------------------------

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    // --------------------------------------------------------
    // SEND VIA BREVO
    // --------------------------------------------------------

    let response;

    try {
      response = await fetch(BREVO_API_URL, {
        method: "POST",

        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          sender: {
            email: EMAIL_FROM,
            name: EMAIL_FROM_NAME,
          },

          to: [recipient],

          subject: String(subject),

          htmlContent,

          ...(textContent ? { textContent } : {}),

          tags: [event],
        }),

        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("Email provider request timed out.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
      ? await response.json()
      : { message: await response.text() };

    if (!response.ok) {
      throw new Error(data?.message || "Email provider request failed.");
    }

    return {
      success: true,
      provider: "brevo",
      event,
      messageId: data?.messageId || null,
    };
  } catch (error) {
    console.error("PoliSync email service error:", error);

    return {
      success: false,
      event,
      message: error?.message || "Unable to send email at this time.",
    };
  }
};

// ============================================================
// REQUEST TIMEOUT
// ============================================================

const REQUEST_TIMEOUT_MS = 15000;

// ============================================================
// EMAIL TEMPLATES
// ============================================================
//
// These wrap sendEmail() with PoliSync-specific transactional
// content so controllers never talk to Brevo directly.
// ============================================================

const sendEmailVerification = async ({ user, code }) => {
  if (!user?.email) {
    throw new Error("A user with a registered email is required.");
  }

  const firstName = user.firstName || "there";

  return sendEmail({
    to: {
      email: user.email,
      name: user.displayName || firstName,
    },

    subject: "Verify your PoliSync Africa email",

    html: `<p>Hi ${firstName},</p> <p>Your PoliSync Africa email verification code is:</p> <p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p> <p>This code will expire shortly. If you did not request this, you can safely ignore this email.</p>`,

    text: `Hi ${firstName}, your PoliSync Africa email verification code is ${code}.`,

    event: "email_verification",
  });
};

const sendSecurityAlert = async ({ user, message }) => {
  if (!user?.email) {
    throw new Error("A user with a registered email is required.");
  }

  const firstName = user.firstName || "there";

  const alertMessage =
    message ||
    "We noticed a new security event on your PoliSync Africa account.";

  return sendEmail({
    to: {
      email: user.email,
      name: user.displayName || firstName,
    },

    subject: "PoliSync Africa security alert",

    html: `<p>Hi ${firstName},</p><p>${alertMessage}</p><p>If this wasn't you, please reset your password immediately.</p>`,

    text: `Hi ${firstName}, ${alertMessage} If this wasn't you, please reset your password immediately.`,

    event: "security_alert",
  });
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendEmail,
  sendEmailVerification,
  sendSecurityAlert,
};
