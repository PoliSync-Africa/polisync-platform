const tenant = (req, res, next) => {
  if (!req.user || !req.user.organizationId) {
    return res.status(403).json({
      success: false,
      message: "Organization context is required."
    });
  }

  req.organizationId = req.user.organizationId;

  next();
};

module.exports = tenant;
