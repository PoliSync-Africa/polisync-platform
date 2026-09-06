const mongoose = require("mongoose");

const authSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      minlength: 32,
      maxlength: 128,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
      maxlength: 128,
    },
    userAgent: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

authSessionSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("AuthSession", authSessionSchema);
