const mongoose = require("mongoose");

// ============================================================
// GHANA REGIONS
// ============================================================
//
// PoliSync Africa currently operates in Ghana.
//
// These are the 16 administrative regions used as the
// highest geographic level for our electoral data.
//
// Constituencies and polling stations will reference the
// Region documents created from this model.
// ============================================================

const regionSchema = new mongoose.Schema(
  {
    // ============================================================
    // REGION NAME
    // ============================================================

    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ============================================================
    // NORMALIZED SLUG
    // ============================================================

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ============================================================
    // COUNTRY
    // ============================================================

    country: {
      type: String,
      required: true,
      default: "Ghana",
      trim: true,
    },

    // ============================================================
    // ADMINISTRATIVE REGION NUMBER
    // ============================================================
    //
    // 1 - 16
    //
    // This allows us to maintain a consistent ordering in
    // dashboards, filters and reports.
    // ============================================================

    regionNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 16,
    },

    // ============================================================
    // STATUS
    // ============================================================

    isActive: {
      type: Boolean,
      default: true,
    },

    // ============================================================
    // PLATFORM DATE
    // ============================================================

    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// NORMALIZE SLUG
// ============================================================

regionSchema.pre("save", function (next) {
  if (this.slug) {
    this.slug = this.slug.toLowerCase().trim();
  }

  if (this.name) {
    this.name = this.name.trim();
  }

  next();
});

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.Region ||
  mongoose.model("Region", regionSchema);
