const mongoose = require("mongoose");

const CheckInSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentAssignment",
      required: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    location: {
      latitude: Number,
      longitude: Number
    },

    network: String,

    battery: Number,

    device: String,

    checkedInAt: {
      type: Date,
      default: Date.now
    }
  }
);

module.exports = mongoose.model("CheckIn", CheckInSchema);
