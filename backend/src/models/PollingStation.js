const mongoose = require("mongoose");

const pollingStationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    code: {
      type: String,
      required: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    country: {
      type: String,
      required: true,
      default: "Ghana"
    },

    region: {
      type: String,
      required: true
    },

    district: {
      type: String,
      required: true
    },

    constituency: {
      type: String,
      required: true,
      index: true
    },

    electoralArea: {
      type: String
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },

    assignedAgents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

// One polling-station code can exist in different organizations,
// but not twice inside the same organization.
pollingStationSchema.index(
  {
    organizationId: 1,
    code: 1
  },
  {
    unique: true
  }
);

// Geographic search
pollingStationSchema.index({
  location: "2dsphere"
});

module.exports = mongoose.model(
  "PollingStation",
  pollingStationSchema
);
