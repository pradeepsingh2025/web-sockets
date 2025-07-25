const Admin = require("../models/Admin");
const { errorResponse } = require("../utils/Helpers");
const { verifyTokenForAdmin } = require("../utils/jwt");

const authenticateAdmin = async (req, res, next) => {
  try {
    const admin_token = req.headers.authorization;

    if (!admin_token) {
      return errorResponse(res, "Access token is required", 401);
    }
    const decoded = verifyTokenForAdmin(admin_token);
    const admin = await Admin.findOne({ adminName: decoded.adminName }).select(
      "-password"
    );
    if (!admin || !admin.isActive) {
      return errorResponse(res, "Admin not found or inactive", 401);
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    req.admin = admin;
    next();
  } catch (error) {
    return errorResponse(res, "Invalid token", 401);
  }
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (
      !req.admin.permissions.includes(permission) &&
      req.admin.role !== "SUPER_ADMIN"
    ) {
      return errorResponse(res, "Insufficient permissions", 403);
    }
    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission,
};
