'use strict';

const express = require('express');

const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const adminController = require('../controllers/admin.controller');

const router = express.Router();

// Todas as rotas admin exigem autenticação + admin
router.use(requireAuth);
router.use(requireAdmin);

// GET /admin/summary
router.get('/summary', adminController.getSummary);

module.exports = router;
