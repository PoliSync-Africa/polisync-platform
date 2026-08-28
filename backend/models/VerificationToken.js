=
  new mongoose.Schema(
    {
      //========================================
      // USER
      //========================================

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
      //
      // IMPORTANT:
      // Do NOT add index: true here.
      //
      // The TTL index below is the only index required for
      // automatic expiration.
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
        enum: [
          "email",
          "sms",
        ],
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
