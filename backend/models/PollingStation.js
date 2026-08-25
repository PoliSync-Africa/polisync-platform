const mongoose = require("mongoose");

// ============================================================
// POLLING STATION MODEL
// ============================================================
//
// Each polling station is an official geographic unit used
// throughout PoliSync Africa.
//
// Relationship:
//
// Ghana
//   ↓
// Region
//   ↓
// Constituency
//   ↓
// Polling Station
//   ↓
// EC Polling Station Code
//
// The polling-station code is the primary external identity
// supplied by the Electoral Commission dataset.
// ============================================================

const pollingStationSchema = new mongoose.Schema(
  {
    // ============================================================
    // EC POLLING STATION CODE
    // ============================================================
    //
    // Example:
    // A010101
    //
    // This must be unique because it identifies one polling
    // station in the EC dataset.
    // ============================================================

    pollingStationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    // ============================================================
    // POLLING STATION NAME
    // ============================================================

    name: {
      type: String,
      required: true,
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
    // CONSTITUENCY
    // ============================================================

    constituencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Constituency",
      required: true,
      index: true,
    },

    // ============================================================
    // DISTRICT / MUNICIPALITY / METROPOLITAN AREA
    // ============================================================

    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ============================================================
    // POLLING STATION TYPE
    // ============================================================
    //
    // "ordinary" = ordinary polling station from the EC list
    //
    // "special" = special polling station where applicable
    //
    // "other" = future/other EC classification
    // ============================================================

    stationType: {
      type: String,
      enum: [
        "ordinary",
        "special",
        "other",
      ],
      default: "ordinary",
      required: true,
    },

    // ============================================================
    // SOURCE INFORMATION
    // ============================================================

    source: {
      type: String,
      default:
        "Ghana Electoral Commission 2024 Polling Stations",
      trim: true,
    },

    sourceYear: {
      type: Number,
      default: 2024,
    },

    // ============================================================
    // ACTIVE STATUS
    // ============================================================

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ============================================================
    // PLATFORM DATES
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

// Find all polling stations in a constituency.

pollingStationSchema.index({
  constituencyId: 1,
  isActive: 1,
});

// Find all polling stations in a region.

pollingStationSchema.index({
  regionId: 1,
  isActive: 1,
});

// Find stations by district.

pollingStationSchema.index({
  district: 1,
  isActive: 1,
});

// Search by station name within a constituency.

pollingStationSchema.index({
  constituencyId: 1,
  name: 1,
});

// Search/filter by station type.

pollingStationSchema.index({
  stationType: 1,
  isActive: 1,
});

// ============================================================
// NORMALIZATION
// ============================================================

pollingStationSchema.pre("save", function (next) {
  if (this.pollingStationCode) {
    this.pollingStationCode =
      this.pollingStationCode.trim().toUpperCase();
  }

  if (this.name) {
    this.name = this.name.trim();
  }

  if (this.district) {
    this.district = this.district.trim();
  }

  next();
});

// ============================================================
// MODEL
// ============================================================

module.exports =
  mongoose.models.PollingStation ||
  mongoose.model(
    "PollingStation",
    pollingStationSchema
  );
