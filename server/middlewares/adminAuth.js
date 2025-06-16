const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { errorResponse } = require('../utils/Helpers');
const config = require('../config/config');


const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse(res, 'Access token is required', 401);
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-passwordHash');

    if (!admin || !admin.isActive) {
      return errorResponse(res, 'Admin not found or inactive', 401);
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    req.admin = admin;
    next();
  } catch (error) {
    return errorResponse(res, 'Invalid token', 401);
  }
};


module.exports = {
    authenticateAdmin
}