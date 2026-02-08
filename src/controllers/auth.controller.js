'use strict';

const { login } = require('../services/auth.service');
const { sendError, sendOk } = require('../utils/http');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isProdLike() {
  const env = (process.env.NODE_ENV || '').toLowerCase();
  return env === 'production';
}

async function loginController(req, res) {
  const body = req.body || {};
  const email = body.email;
  const password = body.password;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    return sendError(res, 400, 'validation_error', 'email e password são obrigatórios', req, {
      fields: ['email', 'password'],
    });
  }

  try {
    const result = await login(String(email).trim(), String(password));

    // Compat: mantém o payload atual do login (token, user, etc.)
    // Não forçamos {data: ...} aqui para NÃO quebrar cliente/testes.
    return res.status(200).json({
      ...result,
      requestId: req.requestId || null,
    });
  } catch (err) {
    // Em DEV/TEST mostramos motivo real para diagnóstico; em PROD não vazamos.
    const safeMessage = isProdLike()
      ? 'Credenciais inválidas'
      : `Credenciais inválidas (debug): ${err && err.message ? err.message : 'unknown_error'}`;

    return sendError(res, 401, 'unauthorized', safeMessage, req);
  }
}

async function meController(req, res) {
  // Aqui pode ser { data, requestId } sem quebrar nada (test-api só imprime).
  return sendOk(res, 200, { user: req.user }, req);
}

module.exports = { loginController, meController };
