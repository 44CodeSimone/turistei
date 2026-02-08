// src/services/services.service.js
// Services Service (mock) — fonte oficial do catálogo em memória.

function listServices() {
  return [
    { id: 1, providerId: 1, name: "Passeio de barco", price: 150 },
    { id: 2, providerId: 2, name: "Trilha guiada", price: 80 },
    { id: 3, providerId: 1, name: "City tour", price: 120 },
  ];
}

function listServicesByProviderId(providerId) {
  const pId = Number(providerId);
  if (!Number.isFinite(pId)) return [];
  return listServices().filter((s) => Number(s.providerId) === pId);
}

function getServiceById(serviceId) {
  const idNum = Number(serviceId);
  if (!Number.isFinite(idNum)) return null;
  return listServices().find((s) => Number(s.id) === idNum) ?? null;
}

// Compatibilidade: algumas versões do orders.service chamam isso
function getAllServices() {
  return listServices();
}

module.exports = {
  listServices,
  listServicesByProviderId,
  getServiceById,
  getAllServices,
};
