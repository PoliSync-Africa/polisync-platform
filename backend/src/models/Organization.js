const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema({
  name: String,
  shortName: String,
  type: {
    type: String,
    enum: ["political_party", "electoral_body", "ngo", "observer"]
  },
  country: String,
  isActive: Boolean
});

module.exports = mongoose.model("Organization", organizationSchema);
