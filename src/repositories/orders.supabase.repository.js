'use strict';

const { getSupabaseClient } = require('../config/supabase.client');

/**
 * Supabase Orders Repository (FASE 2)
 *
 * Fonte de dados real:
 * - Tabela: public.pedidos
 *
 * Auth (turista):
 * - resolve por email via supabase.auth.admin.listUsers() (service role)
 *
 * Observação:
 * - Mantemos contrato do repo (readAllOrders/findOrderById/insertOrder/updateOrderById).
 */

function mapStatusDbToApi(dbStatus) {
  const s = (dbStatus || '').toString().trim().toLowerCase();
  if (s === 'criado') return 'CREATED';
  if (s === 'pago') return 'PAID';
  if (s === 'confirmado') return 'CONFIRMED';
  if (s === 'concluido' || s === 'concluído') return 'COMPLETED';
  if (s === 'cancelado') return 'CANCELLED';
  return 'CREATED';
}

function toNumber(v) {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function resolveTuristaIdByEmail(email) {
  const supabase = getSupabaseClient();

  const target = (email || '').toString().trim().toLowerCase();
  if (!target) {
    const err = new Error('[orders.supabase.repository] resolveTuristaIdByEmail: email is required');
    err.code = 'SUPABASE_TURISTA_EMAIL_REQUIRED';
    throw err;
  }

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    const err = new Error(
      `[orders.supabase.repository] resolveTuristaIdByEmail failed: ${error.message}`
    );
    err.code = 'SUPABASE_RESOLVE_TURISTA_ID_FAILED';
    throw err;
  }

  const users = (data && data.users) ? data.users : [];
  const found = users.find(u => (u.email || '').toString().trim().toLowerCase() === target);

  if (!found) {
    const err = new Error(
      `[orders.supabase.repository] resolveTuristaIdByEmail: user not found for email=${target}`
    );
    err.code = 'SUPABASE_TURISTA_NOT_FOUND';
    throw err;
  }

  return found.id;
}

function mapPedidoRowToApiOrder(row) {
  const createdAt = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();

  return {
    id: row.id,
    customer: {
      id: row.turista_id,
      email: null,
    },
    status: mapStatusDbToApi(row.status),
    history: [
      { at: createdAt, type: 'ORDER_CREATED', message: 'Pedido criado' },
    ],
    createdAt,
    updatedAt: createdAt,
    items: [],
    totals: {
      gross: toNumber(row.valor_bruto),
      final: toNumber(row.valor_final),
    },
    providers: [],
    financial: null,
  };
}

async function readAllOrders() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(
      `[orders.supabase.repository] readAllOrders failed: ${error.message}`
    );
    err.code = 'SUPABASE_READ_ALL_ORDERS_FAILED';
    throw err;
  }

  return (data || []).map(mapPedidoRowToApiOrder);
}

/**
 * 🔥 CORRIGIDO: agora recebe { id, user }
 */
async function findOrderById({ id } = {}) {
  const supabase = getSupabaseClient();

  if (!id) {
    const err = new Error('[orders.supabase.repository] findOrderById: id is required');
    err.code = 'SUPABASE_ORDER_ID_REQUIRED';
    throw err;
  }

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    const err = new Error(
      `[orders.supabase.repository] findOrderById failed: ${error.message}`
    );
    err.code = 'SUPABASE_FIND_ORDER_BY_ID_FAILED';
    throw err;
  }

  if (!data) return null;
  return mapPedidoRowToApiOrder(data);
}

async function insertOrder(order) {
  const supabase = getSupabaseClient();

  const email = order?.customer?.email;
  const turistaId = await resolveTuristaIdByEmail(email);

  const valorBruto = toNumber(order?.totals?.gross);
  const valorFinal = toNumber(order?.totals?.final) || valorBruto;

  const payload = {
    turista_id: turistaId,
    status: 'criado',
    valor_bruto: valorBruto,
    valor_final: valorFinal,
    moeda: (order?.currency || 'BRL'),
  };

  const { data, error } = await supabase
    .from('pedidos')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    const err = new Error(
      `[orders.supabase.repository] insertOrder failed: ${error.message}`
    );
    err.code = 'SUPABASE_INSERT_ORDER_FAILED';
    throw err;
  }

  return mapPedidoRowToApiOrder(data);
}

/**
 * 🔥 CORRIGIDO: agora recebe { id, order, user }
 */
async function updateOrderById({ id, order } = {}) {
  const supabase = getSupabaseClient();

  if (!id) {
    const err = new Error('[orders.supabase.repository] updateOrderById: id is required');
    err.code = 'SUPABASE_ORDER_ID_REQUIRED';
    throw err;
  }

  const update = {};
  const status = order?.status;

  if (status) {
    const s = status.toString().trim().toUpperCase();
    if (s === 'CREATED') update.status = 'criado';
    if (s === 'PAID') update.status = 'pago';
    if (s === 'CONFIRMED') update.status = 'confirmado';
    if (s === 'COMPLETED') update.status = 'concluido';
    if (s === 'CANCELLED') update.status = 'cancelado';
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update(update)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) {
    const err = new Error(
      `[orders.supabase.repository] updateOrderById failed: ${error.message}`
    );
    err.code = 'SUPABASE_UPDATE_ORDER_FAILED';
    throw err;
  }

  if (!data) return null;
  return mapPedidoRowToApiOrder(data);
}

module.exports = {
  readAllOrders,
  findOrderById,
  insertOrder,
  updateOrderById,
};