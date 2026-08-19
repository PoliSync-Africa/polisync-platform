const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        "presidential",
        "parliamentary",
        "local_government",
        "party_primary",
        "referendum",
        "other"
      ]
    },
    country: {
      type: String,
      required: true,
      default: "Ghana"
    },
    region: {
      type: String
    },
    constituency: {
      type: String
    },
    electionDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "closed", "archived"],
      default: "draft"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Election", electionSchema);
