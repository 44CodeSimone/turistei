const { listServices } = require("../services/services.service");

function getServices(req, res) {
  const services = listServices();
  res.json(services);
}

module.exports = {
  getServices
};
