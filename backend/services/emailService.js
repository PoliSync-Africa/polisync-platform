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

const BREVO_API_URL =
  "https://api.brevo.com/v3/smtp/email";

// ============================================================
// ENVIRONMENT CONFIGURATION
// ============================================================

const BREVO_API_KEY =
  process.env.BREVO_API_KEY;

const EMAIL_FROM =
  process.env.EMAIL_FROM;

const EMAIL_FROM_NAME =
  process.env.EMAIL_FROM_NAME ||
  "POLISYNC AFRICA";

// ============================================================
// VALIDATION
// ============================================================

const validateConfiguration = () => {
  if (!BREVO_API_KEY) {
    throw new Error(
      "BREVO_API_KEY is not configured."
    );
  }

  if (!EMAIL_FROM) {
    throw new Error(
      "EMAIL_FROM is not configured."
    );
  }
};

// ============================================================
// NORMALIZE RECIPIENT
// ============================================================

const normalizeRecipient = (
  recipient
) => {
  if (!recipient) {
    return null;
  }

  if (typeof recipient === "string") {
    return {
      email: recipient.trim().toLowerCase(),
    };
  }

  if (
    typeof recipient === "object" &&
    recipient.email
  ) {
    return {
      email: recipient.email
        .trim()
        .toLowerCase(),

      name:
        recipient.name
          ?.trim() ||
        undefined,
    };
  }

  return null;
};

// ============================================================
// SEND EMAIL
// ============================================================

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  event = "transactional",
}) => {
  try {
    validateConfiguration();

    // --------------------------------------------------------
    // RECIPIENT
    // --------------------------------------------------------

    const recipient =
      normalizeRecipient(to);

    if (!recipient?.email) {
      throw new Error(
        "A valid email recipient is required."
      );
    }

    // --------------------------------------------------------
    // SUBJECT
    // --------------------------------------------------------

    if (
      !subject ||
      !String(subject).trim()
    ) {
      throw new Error(
        "Email subject is required."
      );
    }

    // --------------------------------------------------------
    // CONTENT
    // --------------------------------------------------------

    const htmlContent =
      html &&
      String(html).trim()
        ? String(html)
        : `<p>${String(
            text || ""
          )}</p>`;
