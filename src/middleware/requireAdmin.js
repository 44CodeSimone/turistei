'use strict';

const { sendError } = require('../utils/http');

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return sendError(
      res,
      403,
      'AUTH_ADMIN_REQUIRED',
      'Admin privileges required',
      req
    );
  }

  return next();
}

module.exports = requireAdmin;
module.exports.requireAdmin = requireAdmin;
