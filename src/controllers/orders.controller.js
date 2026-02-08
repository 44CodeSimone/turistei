'use strict';

const ordersService = require('../services/orders.service');
const { sendError } = require('../utils/http');

function isObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeError(err) {
  const message = (err && err.message) ? String(err.message) : 'Unexpected error';
  const code = (err && err.code) ? String(err.code) : 'UNEXPECTED_ERROR';
  const status = (err && err.status) ? Number(err.status) : 400;

  return { status, code, message };
}

/**
 * GET /orders
 */
async function listOrders(req, res) {
  try {
    const user = req.user || null;
    const orders = await ordersService.listOrders({ user });
    return res.json(orders);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

/**
 * GET /orders/:id
 */
async function getOrderById(req, res) {
  try {
    const user = req.user || null;
    const id = req.params && req.params.id ? String(req.params.id) : '';

    if (!id) {
      return sendError(res, 400, 'ORDER_ID_REQUIRED', 'Order id is required', req);
    }

    const order = await ordersService.getOrderById({ id, user });

    if (!order) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Order not found', req);
    }

    return res.json(order);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

/**
 * POST /orders
 */
async function createOrder(req, res) {
  try {
    const user = req.user || null;

    const body = req.body;
    if (!isObject(body)) {
      return sendError(res, 400, 'INVALID_BODY', 'Body must be a JSON object', req);
    }

    const created = await ordersService.createOrder(body, { user });
    return res.status(201).json(created);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

/**
 * POST /orders/:id/pay
 */
async function payOrder(req, res) {
  try {
    const user = req.user || null;
    const id = req.params && req.params.id ? String(req.params.id) : '';

    if (!id) {
      return sendError(res, 400, 'ORDER_ID_REQUIRED', 'Order id is required', req);
    }

    const updated = await ordersService.payOrder({ id, user });
    if (!updated) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Order not found', req);
    }

    return res.json(updated);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

/**
 * POST /orders/:id/confirm
 */
async function confirmOrder(req, res) {
  try {
    const user = req.user || null;
    const id = req.params && req.params.id ? String(req.params.id) : '';

    if (!id) {
      return sendError(res, 400, 'ORDER_ID_REQUIRED', 'Order id is required', req);
    }

    const updated = await ordersService.confirmOrder({ id, user });
    if (!updated) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Order not found', req);
    }

    return res.json(updated);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

/**
 * POST /orders/:id/complete
 */
async function completeOrder(req, res) {
  try {
    const user = req.user || null;
    const id = req.params && req.params.id ? String(req.params.id) : '';

    if (!id) {
      return sendError(res, 400, 'ORDER_ID_REQUIRED', 'Order id is required', req);
    }

    const updated = await ordersService.completeOrder({ id, user });
    if (!updated) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Order not found', req);
    }

    return res.json(updated);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

/**
 * POST /orders/:id/cancel
 * Body opcional: { "reason": "..." }
 */
async function cancelOrder(req, res) {
  try {
    const user = req.user || null;
    const id = req.params && req.params.id ? String(req.params.id) : '';

    if (!id) {
      return sendError(res, 400, 'ORDER_ID_REQUIRED', 'Order id is required', req);
    }

    const body = req.body;
    const reason =
      isObject(body) && body.reason !== undefined && body.reason !== null ? String(body.reason) : undefined;

    const updated = await ordersService.cancelOrder({ id, user, reason });
    if (!updated) {
      return sendError(res, 404, 'ORDER_NOT_FOUND', 'Order not found', req);
    }

    return res.json(updated);
  } catch (err) {
    const e = normalizeError(err);
    return sendError(res, e.status, e.code, e.message, req);
  }
}

module.exports = {
  listOrders,
  getOrderById,
  createOrder,
  payOrder,
  confirmOrder,
  completeOrder,
  cancelOrder
};
