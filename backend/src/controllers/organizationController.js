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
    const organizations = await Organization.find().sort({
      createdAt: -1
    });

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
    const { id } = req.params;

    // Super Admin can update any organization
    if (req.user.role === "super_admin") {
      const organization = await Organization.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "Organization not found."
        });
      }

      return res.json({
        success: true,
        message: "Organization updated successfully.",
        data: organization
      });
    }

    // Party Admin can update only their own organization
    if (req.user.role === "party_admin") {
      if (
        !req.user.organizationId ||
        req.user.organizationId.toString() !== id
      ) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own organization."
        });
      }

      const organization = await Organization.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

      if (!organization) {
        return res.status(404).json({
          success: false,
          message: "Organization not found."
        });
      }

      return res.json({
        success: true,
        message: "Organization updated successfully.",
        data: organization
      });
    }

    return res.status(403).json({
      success: false,
      message: "Access denied."
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
