const OrganizationUnit = require("../models/OrganizationUnit");

exports.createUnit = async (req, res) => {
  try {
    const unit = await OrganizationUnit.create(req.body);

    res.status(201).json({
      success: true,
      message: "Organization unit created successfully.",
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getChildren = async (req, res) => {
  try {
    const children = await OrganizationUnit.find({
      parentId: req.params.parentId
    }).sort({ name: 1 });

    res.json({
      success: true,
      count: children.length,
      data: children
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.assignManager = async (req, res) => {
  try {
    const unit = await OrganizationUnit.findByIdAndUpdate(
      req.params.id,
      { managerId: req.body.managerId },
      { new: true }
    );

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Organization unit not found."
      });
    }

    res.json({
      success: true,
      message: "Manager assigned successfully.",
      data: unit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getHierarchy = async (req, res) => {
  try {
    const units = await OrganizationUnit.find({
      organizationId: req.params.organizationId
    }).sort({ type: 1, name: 1 });

    res.json({
      success: true,
      count: units.length,
      data: units
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
