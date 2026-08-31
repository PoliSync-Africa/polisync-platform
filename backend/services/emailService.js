require("dotenv").config();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "POLISYNC AFRICA";
const REQUEST_TIMEOUT_MS = 15000;

const validateConfiguration = () => {
  if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY is not configured.");
  if (!EMAIL_FROM) throw new Error("EMAIL_FROM is not configured.");
};

const normalizeRecipient = (recipient) => {
  if (!recipient) return null;
  if (typeof recipient === "string") return { email: recipient.trim().toLowerCase() };
  if (typeof recipient === "object" && recipient.email) {
    return { email: recipient.email.trim().toLowerCase(), name: recipient.name?.trim() || undefined };
  }
  return null;
};

const sendEmail = async ({ to, subject, html, text, event = "transactional" }) => {
  try {
    validateConfiguration();
    const recipient = normalizeRecipient(to);
    if (!recipient?.email) throw new Error("A valid email recipient is required.");
    if (!subject || !String(subject).trim()) throw new Error("Email subject is required.");

    const htmlContent = html && String(html).trim() ? String(html) : `<p>${String(text || "")}</p>`;
    const textContent = text && String(text).trim() ? String(text) : undefined;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

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
          sender: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
          to: [recipient],
          subject: String(subject),
          htmlContent,
          ...(textContent ? { textContent } : {}),
          tags: [event],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") throw new Error("Email provider request timed out.");
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : { message: await response.text() };
    if (!response.ok) throw new Error(data?.message || "Email provider request failed.");

    return { success: true, provider: "brevo", event, messageId: data?.messageId || null };
  } catch (error) {
    console.error("PoliSync email service error:", error);
    return { success: false, event, message: error?.message || "Unable to send email at this time." };
  }
};

const sendEmailVerification = async ({ user, code }) => {
  if (!user?.email) throw new Error("A user with a registered email is required.");
  const firstName = user.firstName || "there";
  return sendEmail({
    to: { email: user.email, name: user.displayName || firstName },
    subject: "Verify your PoliSync Africa email",
    html: `<p>Hi ${firstName},</p><p>Your PoliSync Africa email verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code will expire shortly. If you did not request this, you can safely ignore this email.</p>`,
    text: `Hi ${firstName}, your PoliSync Africa email verification code is ${code}.`,
    event: "email_verification",
  });
};

const sendPasswordResetEmail = async ({ user, code }) => {
  if (!user?.email) throw new Error("A user with a registered email is required.");
  const firstName = user.firstName || "there";
  return sendEmail({
    to: { email: user.email, name: user.displayName || firstName },
    subject: "Your PoliSync Africa password reset code",
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2d25"><h2 style="color:#075f2b">Password Reset</h2><p>Hi ${firstName},</p><p>We received a request to reset your PoliSync Africa password.</p><p>Your password reset code is:</p><p style="font-size:30px;font-weight:800;letter-spacing:7px;color:#075f2b">${code}</p><p>This code expires in 15 minutes and can only be used once.</p><p>If you did not request a password reset, you can safely ignore this email.</p><p>— POLISYNC AFRICA</p></div>`,
    text: `Hi ${firstName}, your PoliSync Africa password reset code is ${code}. It expires in 15 minutes and can only be used once. If you did not request this, you can safely ignore this email.`,
    event: "password_reset",
  });
};

const sendSecurityAlert = async ({ user, message }) => {
  if (!user?.email) throw new Error("A user with a registered email is required.");
  const firstName = user.firstName || "there";
  const alertMessage = message || "We noticed a new security event on your PoliSync Africa account.";
  return sendEmail({
    to: { email: user.email, name: user.displayName || firstName },
    subject: "PoliSync Africa security alert",
    html: `<p>Hi ${firstName},</p><p>${alertMessage}</p><p>If this wasn't you, please reset your password immediately.</p>`,
    text: `Hi ${firstName}, ${alertMessage} If this wasn't you, please reset your password immediately.`,
    event: "security_alert",
  });
};

module.exports = { sendEmail, sendEmailVerification, sendPasswordResetEmail, sendSecurityAlert };
