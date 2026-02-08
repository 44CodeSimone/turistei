'use strict';

/**
 * Supabase Orders Repository (placeholder)
 *
 * Future implementation for real DB persistence.
 * Keeps the same interface as the file repository.
 *
 * Rules:
 * - Must not be used unless TURISTEI_USE_SUPABASE === "true"
 * - When implementing, replace throws with real Supabase calls
 */

function notImplemented(method) {
  const err = new Error(`[orders.supabase.repository] NOT_IMPLEMENTED: ${method}`);
  err.code = 'REPO_NOT_IMPLEMENTED';
  err.repo = 'supabase';
  err.method = method;
  return err;
}

/**
 * Compat with file repo:
 * - readAllOrders({ user })
 */
function readAllOrders() {
  throw notImplemented('readAllOrders');
}

/**
 * Compat with file repo:
 * - findOrderById("ord_...")
 * - findOrderById({ id, user })
 */
function findOrderById() {
  throw notImplemented('findOrderById');
}

/**
 * Compat with file repo:
 * - insertOrder(order)
 */
function insertOrder() {
  throw notImplemented('insertOrder');
}

/**
 * Compat with file repo:
 * - updateOrderById({ id, order, user })
 */
function updateOrderById() {
  throw notImplemented('updateOrderById');
}

module.exports = {
  readAllOrders,
  findOrderById,
  insertOrder,
  updateOrderById,
};
