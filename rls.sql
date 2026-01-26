-- =====================================================
-- TURISTEI - RLS POLICIES (DOCUMENTATION)
-- IMPORTANT:
-- This file documents the RLS rules applied in production.
-- Execution in Supabase should follow the project’s hardened security flow.
-- =====================================================

-- This project enforces:
-- - RLS ON + FORCE RLS on all tables
-- - No direct GRANT for anon/authenticated
-- - app_* and meu_* functions for authenticated access
-- - admin_* functions for service_role only
-- - Public access ONLY through view v_servicos_busca

-- =====================================================
-- NOTE
-- Detailed policies are intentionally maintained in the database (production).
-- This repository mirrors the rules for traceability and auditing.
-- =====================================================
