'use strict';

// Controller Admin (Big Tech mínimo, seguro)

function getSummary(req, res) {
  return res.json({
    status: 'ok',
    service: 'admin',
    message: 'Admin API online',
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
}

module.exports = {
  getSummary
};
