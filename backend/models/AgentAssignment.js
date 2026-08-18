const mongoose = require("mongoose");

const AgentAssignmentSchema = new mongoose.Schema(
  {
    election: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ElectionEvent",
      required: true
    },

    pollingStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeoUnit",
      required: true
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    backupAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    status: {
      type: String,
      enum: [
        "Assigned",
        "CheckedIn",
        "Completed"
      ],
      default: "Assigned"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AgentAssignment", AgentAssignmentSchema);
