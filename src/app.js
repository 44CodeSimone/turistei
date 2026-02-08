'use strict';

const express = require('express');

const healthRoutes = require('./routes/health.routes');
const servicesRoutes = require('./routes/services.routes');
const providersRoutes = require('./routes/providers.routes');
const ordersRoutes = require('./routes/orders.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Hardening mínimo (sem dependências externas)
app.disable('x-powered-by');

// Body parser com limite (evita payloads gigantes acidentais)
app.use(express.json({ limit: '1mb' }));

// Helpers de resposta (contrato consistente)
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

// Observabilidade mínima (SRE basic)
// - requestId por request
// - log 1-linha por request (método, path, status, ms, requestId)
app.use((req, res, next) => {
  const rid =
    (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id'].trim()) ||
    `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  req.requestId = rid;
  res.setHeader('x-request-id', rid);

  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] requestId=${rid} ${req.method} ${req.originalUrl} status=${res.statusCode} ms=${ms}`
    );
  });

  next();
});

// Rota raiz
app.get('/', (req, res) => {
  return res.send('API Turistei online ✅');
});

// Rotas da API
app.use('/health', healthRoutes);
app.use('/services', servicesRoutes);
app.use('/providers', providersRoutes);
app.use('/orders', ordersRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

// 404 profissional (com contrato consistente)
app.use((req, res) => {
  return sendError(res, 404, 'not_found', 'Rota não encontrada.', req, {
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handler profissional (contrato consistente)
app.use((err, req, res, next) => {
  console.error(
    `[${new Date().toISOString()}] requestId=${req && req.requestId ? req.requestId : 'unknown'} ERROR`,
    err
  );

  return sendError(res, 500, 'internal_server_error', 'Erro interno no servidor.', req);
});

module.exports = app;
