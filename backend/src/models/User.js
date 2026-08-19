const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "country_admin",
        "regional_admin",
        "constituency_officer",
        "polling_station_agent",
        "observer"
      ],
      default: "observer"
    },
    country: {
      type: String,
      default: "Ghana"
    },
    region: {
      type: String
    },
    constituency: {
      type: String
    },
    pollingStation: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
