/**
 * orders.repository.js
 *
 * Seletor de repositório (pattern): expõe UMA interface estável para a camada de services.
 * Hoje aponta para file repository (pedido.json).
 * Futuro: pode alternar para Supabase mantendo a mesma interface.
 */
module.exports = require('./orders.file.repository');
