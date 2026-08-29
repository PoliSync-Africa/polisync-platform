const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
  {
    // ========================================================
    // USER
    // ========================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================================
    // TOKEN PURPOSE
    // ========================================================

    purpose: {
      type: String,
      enum: [
        "email_verification",
        "phone_verification",
        "password_reset",
        "two_factor_authentication",
        "login_verification",
      ],
      required: true,
      index: true,
    },

    // ========================================================
    // TOKEN HASH
    // ========================================================
    // Never store the actual OTP/code.
    // ========================================================

    tokenHash: {
      type: String,
      required: true,
      index: true,
    },

    // ========================================================
    // EXPIRATION
    // ========================================================

    expiresAt: {
      type: Date,
      required: true,
    },

    // ========================================================
    // USAGE
    // ========================================================

    usedAt: {
      type: Date,
      default: null,
    },

    // ========================================================
    // ATTEMPT CONTROL
    // ========================================================

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxAttempts: {
      type: Number,
      default: 5,
      min: 1,
    },

    // ========================================================
    // DELIVERY CHANNEL
    // ========================================================

    channel: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },

    // ========================================================
    // SECURITY / AUDIT
    // ========================================================

    requestedIp: {
      type: String,
      default: null,
      trim: true,
    },

    userAgent: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// AUTOMATIC EXPIRATION — TTL INDEX
// ============================================================

verificationTokenSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

// ============================================================
// PREVENT UNLIMITED ATTEMPTS
// ============================================================

verificationTokenSchema.pre("validate", function (next) {
  if (this.attempts > this.maxAttempts) {
    this.attempts = this.maxAttempts;
  }

  next();
});

// ============================================================
// HELPER: TOKEN ACTIVE
// ============================================================

verificationTokenSchema.methods.isActive = function () {
  // Token has already been used
  if (this.usedAt) {
    return false;
  }

  // Token has expired
  if (this.expiresAt <= new Date()) {
    return false;
  }

  // Maximum attempts reached
  if (this.attempts >= this.maxAttempts) {
    return false;
  }

  return true;
};

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.VerificationToken ||
  mongoose.model("VerificationToken", verificationTokenSchema);
