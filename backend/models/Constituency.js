const mongoose = require("mongoose");

// ============================================================
// GHANA PARLIAMENTARY CONSTITUENCY
// ============================================================
//
// Each constituency belongs to exactly one Region.
//
// Polling stations will later reference the Constituency
// document through constituencyId.
// ============================================================

const constituencySchema = new mongoose.Schema(
  {
    // ============================================================
    // CONSTITUENCY NAME
    // ============================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // ============================================================
    // NORMALIZED SLUG
    // ============================================================

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // ============================================================
    // REGION
    // ============================================================

    regionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Region",
      required: true,
      index: true,
    },

    // ============================================================
    // DISTRICT
    // ============================================================
    //
    // The EC polling-station data contains a District field.
    // We retain it here because multiple constituencies can
    // belong to the same district/municipality.
    // ============================================================

    district: {
      type: String,
      required: true,
      trim: true,
    },

    // ============================================================
    // CONSTITUENCY ORDER
    // ============================================================
    //
    // Used for consistent display and reporting.
    // ============================================================

    constituencyNumber: {
      type: Number,
      default: null,
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
// INDEXES
// ============================================================

// Fast lookup of constituencies within a region.

const constituencyIndexes = [
  {
    regionId: 1,
    name: 1,
  },
  {
    regionId: 1,
    isActive: 1,
  },
  {
    slug: 1,
  },
];

// Apply indexes.

const existingIndexes = constituencySchema.indexes();

for (const index of constituencyIndexes) {
  constituencySchema.index(index);
}

// ============================================================
// NORMALIZATION
// ============================================================

const normalizeText = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
};

const normalizeSlug = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

constituencySchema.pre("save", function (next) {
  if (this.name) {
    this.name = normalizeText(this.name);
  }

  if (this.slug) {
    this.slug = normalizeSlug(this.slug);
  }

  if (this.district) {
    this.district = normalizeText(this.district);
  }

  next();
});

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.Constituency ||
  mongoose.model("Constituency", constituencySchema);
