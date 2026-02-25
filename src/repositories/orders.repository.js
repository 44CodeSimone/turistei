'use strict';

/**
 * Orders repository selector.
 *
 * Regras:
 * - Default seguro: FILE repository.
 * - Supabase só ativa explicitamente por feature flag.
 * - Não alterar contratos (interface).
 *
 * Flags suportadas:
 * - TURISTEI_ORDERS_REPOSITORY=file|supabase
 *
 * Observação:
 * - Se 'supabase' estiver selecionado mas o repo não estiver configurado,
 *   ele deve falhar explicitamente (erro controlado).
 */

const fileRepo = require('./orders.file.repository');
const supabaseRepo = require('./orders.supabase.repository');

function resolveRepo() {
  const raw = process.env.TURISTEI_ORDERS_REPOSITORY;
  const value = (raw || 'file').toString().trim().toLowerCase();

  if (value === 'file') return fileRepo;
  if (value === 'supabase') return supabaseRepo;

  // Fail fast: flag inválida
  const err = new Error(
    `[orders.repository] Invalid TURISTEI_ORDERS_REPOSITORY='${raw}'. ` +
      `Expected 'file' or 'supabase'.`
  );
  err.code = 'INVALID_ORDERS_REPOSITORY_FLAG';
  throw err;
}

const repo = resolveRepo();

// Interface (contrato) imutável
module.exports = {
  readAllOrders: repo.readAllOrders,
  findOrderById: repo.findOrderById,
  insertOrder: repo.insertOrder,
  updateOrderById: repo.updateOrderById,
};
