'use strict';

const express = require('express');

const { loginController, meController } = require('../controllers/auth.controller');

// IMPORT CORRETO: export é função direta (module.exports = requireAuth)
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

if (typeof loginController !== 'function') {
  throw new Error('auth.routes.js: auth.controller must export loginController (function)');
}

if (typeof meController !== 'function') {
  throw new Error('auth.routes.js: auth.controller must export meController (function)');
}

// POST /auth/login
router.post('/login', loginController);

// GET /auth/me (rota protegida)
router.get('/me', requireAuth, meController);

module.exports = router;
