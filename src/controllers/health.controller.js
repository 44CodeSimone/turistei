const { getHealthStatus } = require("../services/health.service");

function healthCheck(req, res) {
  const payload = getHealthStatus();
  res.json(payload);
}

module.exports = {
  healthCheck
};
