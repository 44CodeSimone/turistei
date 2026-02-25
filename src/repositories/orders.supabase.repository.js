'use strict';

const { getSupabaseClient } = require('../config/supabase.client');

/**
 * Supabase Orders Repository
 *
 * Implementação inicial:
 * - SOMENTE readAllOrders
 * - Demais métodos permanecem como "not configured"
 *
 * Fonte de dados esperada:
 * - View ou tabela: orders
 *   (ajustável depois; não supor joins agora)
 */

async function readAllOrders() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(
      `[orders.supabase.repository] readAllOrders failed: ${error.message}`
    );
    err.code = 'SUPABASE_READ_ALL_ORDERS_FAILED';
    throw err;
  }

  return data || [];
}

function notConfigured(method) {
  const err = new Error(
    `[orders.supabase.repository] ${method} not configured. Supabase integration is not enabled in this phase step.`
  );
  err.code = 'SUPABASE_REPO_NOT_CONFIGURED';
  throw err;
}

module.exports = {
  readAllOrders,
  findOrderById: () => notConfigured('findOrderById'),
  insertOrder: () => notConfigured('insertOrder'),
  updateOrderById: () => notConfigured('updateOrderById'),
};