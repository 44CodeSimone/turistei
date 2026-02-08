'use strict';

// Carrega variáveis de ambiente automaticamente (.env)
require('dotenv').config();

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampPercent(v) {
  const n = toNumber(v);
  if (n === null) return null;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

function requireEnv(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.trim() ? v.trim() : '';
}

function assertConfig() {
  const nodeEnv = String(process.env.NODE_ENV || '').toLowerCase();
  const isProd = nodeEnv === 'production';

  // PORT validation (opcional)
  if (process.env.PORT !== undefined) {
    const port = toNumber(process.env.PORT);
    if (port === null || port <= 0) {
      throw new Error('Config inválida: PORT deve ser um número positivo.');
    }
  }

  // Commission percent validation (opcional)
  if (process.env.TURISTEI_PLATFORM_COMMISSION_PERCENT !== undefined) {
    const pct = clampPercent(process.env.TURISTEI_PLATFORM_COMMISSION_PERCENT);
    if (pct === null) {
      throw new Error(
        'Config inválida: TURISTEI_PLATFORM_COMMISSION_PERCENT deve ser um número entre 0 e 100.'
      );
    }

    if (isProd) {
      const raw = toNumber(process.env.TURISTEI_PLATFORM_COMMISSION_PERCENT);
      if (raw !== null && (raw < 0 || raw > 100)) {
        throw new Error(
          'Config inválida: TURISTEI_PLATFORM_COMMISSION_PERCENT em produção deve estar entre 0 e 100.'
        );
      }
    }
  }

  // JWT secret: obrigatório em produção
  const jwtSecret = requireEnv('JWT_SECRET');
  if (isProd && !jwtSecret) {
    throw new Error(
      'Config inválida: JWT_SECRET é obrigatório em produção (NODE_ENV=production).'
    );
  }

  // Em dev/test, apenas aviso
  if (!isProd && !jwtSecret) {
    console.warn('[WARN] JWT_SECRET não definido (ok em dev/test).');
  }
}

assertConfig();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API Turistei rodando em http://localhost:${PORT}`);
});
