'use strict';

/**
 * Contrato único de erro para a API inteira.
 * Mantém compat com o app.js (sendError) e é seguro para usar em controllers/middlewares.
 *
 * Formato:
 * {
 *   error: { code, message, requestId, details? }
 * }
 */
function sendError(res, status, code, message, req, details) {
  const payload = {
    error: {
      code: String(code || 'error'),
      message: String(message || 'Erro'),
      requestId: (req && req.requestId) || null,
    },
  };

  if (details !== undefined) payload.error.details = details;

  return res.status(status).json(payload);
}

/**
 * Resposta OK opcional (para padronizar em endpoints que você quiser).
 * Formato:
 * { data, requestId }
 */
function sendOk(res, status, data, req) {
  return res.status(status).json({
    data,
    requestId: (req && req.requestId) || null,
  });
}

module.exports = { sendError, sendOk };
