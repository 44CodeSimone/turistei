'use strict';

const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client (server-side).
 *
 * Regras:
 * - Nunca hardcode de URL ou KEY.
 * - Usar APENAS variáveis de ambiente.
 * - Service role é permitido aqui (API server).
 *
 * Variáveis esperadas:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    const err = new Error('[supabase.client] Missing SUPABASE_URL');
    err.code = 'MISSING_SUPABASE_URL';
    throw err;
  }

  if (!key) {
    const err = new Error('[supabase.client] Missing SUPABASE_SERVICE_ROLE_KEY');
    err.code = 'MISSING_SUPABASE_SERVICE_ROLE_KEY';
    throw err;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

module.exports = {
  getSupabaseClient,
};
