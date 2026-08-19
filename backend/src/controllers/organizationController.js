const Organization = require("../models/Organization");

exports.createOrganization = async (req, res) => {
  try {
    const organization = await Organization.create(req.body);

    res.status(201).json({
      success: true,
      message: "Organization created successfully.",
      data: organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ name: 1 });

    res.json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getOrganizationById = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found."
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateOrganization = async (req, res) => {
  try {
    const organization = await Organization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found."
      });
    }

    res.json({
      success: true,
      message: "Organization updated successfully.",
      data: organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
