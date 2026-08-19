const tenant = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  const { role, organizationId, country } = req.user;

  // Super Admin has platform-wide access.
  if (role === "super_admin") {
    req.isPlatformAdmin = true;
    req.organizationId = null;
    req.country = null;

    return next();
  }

  // Country Admin has country-wide access.
  // This does NOT automatically give access to every party's private data.
  if (role === "country_admin") {
    if (!country) {
      return res.status(403).json({
        success: false,
        message: "Country context is required."
      });
    }

    req.isCountryAdmin = true;
    req.country = country;
    req.organizationId = null;

    return next();
  }

  // All organization-based users must belong to an organization.
  if (!organizationId) {
    return res.status(403).json({
      success: false,
      message: "Organization context is required."
    });
  }

  // Party Admin and all lower organizational roles
  // are restricted to their own organization.
  req.isOrganizationUser = true;
  req.organizationId = organizationId;
  req.country = country || null;

  next();
};

module.exports = tenant;
