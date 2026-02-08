'use strict';

const { verifyToken } = require('../services/auth.service');
const { sendError } = require('../utils/http');

function extractBearerToken(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;

  const trimmed = header.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 2) return null;

  const [scheme, token] = parts;

  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  if (!token) return null;

  return token;
}

function requireAuth(req, res, next) {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      return sendError(
        res,
        401,
        'AUTH_MISSING_BEARER_TOKEN',
        'Missing Bearer token',
        req
      );
    }

    const decoded = verifyToken(token);

    const userId = decoded && decoded.sub;
    if (!userId) {
      return sendError(
        res,
        401,
        'AUTH_INVALID_TOKEN_SUBJECT',
        'Invalid token subject',
        req
      );
    }

    req.user = {
      id: String(userId),
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    return sendError(
      res,
      401,
      'AUTH_INVALID_OR_EXPIRED_TOKEN',
      'Invalid or expired token',
      req
    );
  }
}

/**
 * Compatibilidade Enterprise:
 * - permite: const requireAuth = require(...)
 * - permite: const { requireAuth } = require(...)
 */
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
