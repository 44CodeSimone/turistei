'use strict';

const express = require('express');

const {
  createOrder,
  listOrders,
  getOrderById,
  payOrder,
  confirmOrder,
  completeOrder,
  cancelOrder
} = require('../controllers/orders.controller');

// IMPORT CORRETO: export é função direta (module.exports = requireAuth)
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

if (typeof requireAuth !== 'function') {
  throw new TypeError('orders.routes.js: requireAuth must be a function');
}

// Todas as rotas de pedidos exigem autenticação
router.use(requireAuth);

if (typeof createOrder !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export createOrder (function)');
}

if (typeof listOrders !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export listOrders (function)');
}

if (typeof getOrderById !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export getOrderById (function)');
}

if (typeof payOrder !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export payOrder (function)');
}

if (typeof confirmOrder !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export confirmOrder (function)');
}

if (typeof completeOrder !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export completeOrder (function)');
}

if (typeof cancelOrder !== 'function') {
  throw new Error('orders.routes.js: orders.controller must export cancelOrder (function)');
}

// GET /orders
router.get('/', listOrders);

// GET /orders/:id
router.get('/:id', getOrderById);

// POST /orders
router.post('/', createOrder);

// Lifecycle (status machine)
// POST /orders/:id/pay
router.post('/:id/pay', payOrder);

// POST /orders/:id/confirm
router.post('/:id/confirm', confirmOrder);

// POST /orders/:id/complete
router.post('/:id/complete', completeOrder);

// POST /orders/:id/cancel  (body opcional { reason })
router.post('/:id/cancel', cancelOrder);

module.exports = router;
