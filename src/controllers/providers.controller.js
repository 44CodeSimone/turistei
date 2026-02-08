const { listProviders } = require("../services/providers.service");
const { listServicesByProviderId } = require("../services/services.service");

function getProviders(req, res) {
  const providers = listProviders();
  res.json(providers);
}

function getProviderServices(req, res) {
  const { id } = req.params;

  const services = listServicesByProviderId(id);
  res.json(services);
}

module.exports = {
  getProviders,
  getProviderServices
};
