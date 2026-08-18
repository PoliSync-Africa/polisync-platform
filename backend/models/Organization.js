
const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    required: true,
    unique: true
  },

  type: {
    type: String,
    enum: [
      "Political Party",
      "Election Commission",
      "Observer Mission",
      "Research Institution",
      "NGO"
    ],
    required: true
  },

  country: {
    type: String,
    required: true
  },

  logo: String,

  subscription: {
    plan: {
      type: String,
      default: "Starter"
    },

    status: {
      type: String,
      default: "Active"
    }
  }

}, {
  timestamps: true
});

module.exports = mongoose.model("Organization", organizationSchema);
