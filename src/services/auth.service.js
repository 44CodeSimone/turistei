'use strict';

const jwt = require('jsonwebtoken');

const ISSUER = 'turistei';
const AUDIENCE = 'turistei-api';
const DEFAULT_EXPIRES_IN = '2h';

function isProdLike() {
  const env = (process.env.NODE_ENV || '').toLowerCase();
  return env === 'production';
}

function getJwtSecretOrThrow() {
  const secret = process.env.JWT_SECRET;

  if (secret && typeof secret === 'string' && secret.length >= 16) {
    return secret;
  }

  if (isProdLike()) {
    throw new Error('JWT_SECRET is required in production and must be at least 16 characters.');
  }

  const allowFallback = (process.env.TURISTEI_ALLOW_JWT_FALLBACK || '').toLowerCase() === 'true';
  if (!allowFallback) {
    throw new Error(
      'JWT_SECRET is not set (or too short). In dev/test set JWT_SECRET (>=16) or set TURISTEI_ALLOW_JWT_FALLBACK=true to allow a temporary fallback.'
    );
  }

  const fallback = 'TURISTEI_DEV_SECRET_2026__troque_isto_agora';
  if (!secret) {
    // eslint-disable-next-line no-console
    console.warn('WARN: JWT_SECRET not defined. Using DEV fallback. Set JWT_SECRET (>=16) immediately.');
  }
  return fallback;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * DEV/TEST seed users:
 * - permitido apenas fora de production
 * - padrão (alinhado ao tools/test-api.ps1 e tools/test-ownership.ps1)
 * - override opcional via env TURISTEI_SEED_USERS_JSON
 *
 * TURISTEI_SEED_USERS_JSON exemplo:
 * [
 *   {"id":"u1","email":"a@a.com","password":"123456","role":"admin"},
 *   {"id":"u2","email":"b@b.com","password":"123456","role":"user"}
 * ]
 */
function getSeedUsersOrThrow() {
  if (isProdLike()) {
    throw new Error('Seed users are not allowed in production.');
  }

  const raw = process.env.TURISTEI_SEED_USERS_JSON;

  if (isNonEmptyString(raw)) {
    let parsed;
    try {
      parsed = JSON.parse(String(raw));
    } catch {
      throw new Error('TURISTEI_SEED_USERS_JSON must be valid JSON.');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('TURISTEI_SEED_USERS_JSON must be a non-empty JSON array.');
    }

    const normalized = parsed.map((u) => ({
      id: isNonEmptyString(u && u.id) ? String(u.id) : null,
      email: isNonEmptyString(u && u.email) ? String(u.email).trim() : null,
      password: isNonEmptyString(u && u.password) ? String(u.password) : null,
      role: isNonEmptyString(u && u.role) ? String(u.role).trim().toLowerCase() : 'user',
    }));

    const ok = normalized.every((u) => u.id && u.email && u.password && u.role);
    if (!ok) {
      throw new Error('TURISTEI_SEED_USERS_JSON entries must include id, email, password, role.');
    }

    return normalized;
  }

  // Defaults (enterprise dev/test)
  return [
    { id: 'u_simone_1', email: 'simone@turistei.com', password: '123456', role: 'admin' },
    { id: 'u_user2_1', email: 'user2@turistei.com', password: '123456', role: 'user' },
    { id: 'u_user3_1', email: 'user3@turistei.com', password: '123456', role: 'user' }, // <- novo
    { id: 'u_admin2_1', email: 'admin@turistei.com', password: '123456', role: 'admin' },
  ];
}

function signToken({ userId, email, role }, opts = {}) {
  if (!userId) throw new Error('userId is required to sign token');
  if (!email) throw new Error('email is required to sign token');
  if (!role) throw new Error('role is required to sign token');

  const secret = getJwtSecretOrThrow();
  const expiresIn = opts.expiresIn || DEFAULT_EXPIRES_IN;

  const payload = { email, role };

  return jwt.sign(payload, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: String(userId),
    expiresIn
  });
}

function verifyToken(token) {
  const secret = getJwtSecretOrThrow();
  return jwt.verify(token, secret, {
    issuer: ISSUER,
    audience: AUDIENCE
  });
}

/**
 * login(email, password) -> { token }
 * - valida contra seed users (dev/test)
 * - proibido em production
 */
async function login(email, password) {
  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw new Error('email and password are required');
  }

  const users = getSeedUsersOrThrow();
  const e = String(email).trim().toLowerCase();
  const p = String(password);

  const found = users.find((u) => String(u.email).trim().toLowerCase() === e && String(u.password) === p);
  if (!found) {
    throw new Error('invalid credentials');
  }

  const token = signToken({ userId: found.id, email: found.email, role: found.role });
  return { token };
}

module.exports = {
  ISSUER,
  AUDIENCE,
  signToken,
  verifyToken,
  login
};
