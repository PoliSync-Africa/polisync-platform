const mongoose = require("mongoose");

const verificationTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
    // For Arkesel-managed OTPs this stores a local challenge nonce hash;
    // the actual OTP remains with Arkesel and is never stored by PoliSync.
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
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
    channel: {
      type: String,
      enum: ["email", "sms"],
      required: true,
    },
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
  { timestamps: true }
);

verificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

verificationTokenSchema.pre("validate", function (next) {
  if (this.attempts > this.maxAttempts) this.attempts = this.maxAttempts;
  next();
});

verificationTokenSchema.methods.isActive = function () {
  if (this.usedAt) return false;
  if (this.expiresAt <= new Date()) return false;
  if (this.attempts >= this.maxAttempts) return false;
  return true;
};

module.exports =
  mongoose.models.VerificationToken ||
  mongoose.model("VerificationToken", verificationTokenSchema);
