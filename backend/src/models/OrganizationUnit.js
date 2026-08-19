const mongoose = require("mongoose");

const organizationUnitSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    country: {
      type: String,
      required: true,
      default: "Ghana"
    },

    type: {
      type: String,
      required: true,
      enum: [
        "country",
        "region",
        "constituency",
        "electoral_area",
        "polling_station"
      ]
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    code: {
      type: String,
      trim: true
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OrganizationUnit",
      default: null
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

organizationUnitSchema.index({
  organizationId: 1,
  type: 1,
  name: 1
});

module.exports = mongoose.model(
  "OrganizationUnit",
  organizationUnitSchema
);
