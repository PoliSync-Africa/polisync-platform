const mongoose = require("mongoose");

const ElectionEventSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },

    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    electionType: {
      type: String,
      enum: [
        "Presidential",
        "Parliamentary",
        "Local Government",
        "Primary Election",
        "Referendum"
      ],
      required: true
    },

    electionDate: Date,

    status: {
      type: String,
      enum: [
        "Draft",
        "Scheduled",
        "Live",
        "Completed"
      ],
      default: "Draft"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("ElectionEvent", ElectionEventSchema);
