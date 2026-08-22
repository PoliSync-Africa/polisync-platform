const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    default: ""
  },

  accountType: {
    type: String,
    enum: [
      "individual",
      "organization",
      "political-party"
    ],
    default: "individual"
  },

  role: {
    type: String,
    enum: [
      "super_admin",
      "country_admin",
      "regional_admin",
      "constituency_admin",
      "polling_agent",
      "researcher",
      "observer",
      "voter"
    ],
    default: "voter"
  },

  country: {
    type: String,
    default: "Ghana"
  },

  party: {
    type: String,
    default: ""
  },

  region: {
    type: String,
    default: ""
  },

  constituency: {
    type: String,
    default: ""
  },

  pollingStation: {
    type: String,
    default: ""
  },

  invitationCode: {
    type: String,
    default: ""
  },

  isVerified: {
    type: Boolean,
    default: false
  }

},
{
  timestamps: true
});

module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);
