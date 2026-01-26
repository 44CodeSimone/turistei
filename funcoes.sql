-- =====================================================
-- TURISTEI - FUNCTIONS / RPCs (DOCUMENTATION)
-- IMPORTANT:
-- This file documents the functions/RPCs used in production.
-- Turistei security rules:
-- - admin_*   => EXECUTE only service_role
-- - app_* / meu_* => EXECUTE only authenticated
-- - PUBLIC never
-- =====================================================

-- =====================================================
-- APP RPCs (authenticated)
-- =====================================================
-- app_criar_pedido(...)
-- Creates a new order (pedido) for auth.uid() and inserts items.
-- Recalculates totals and prepares the order for payment flow.

-- meu_prestador()
-- Returns the current provider record for auth.uid().

-- meus_servicos()
-- Returns services owned by the current provider (auth.uid()).

-- minha_assinatura_atual()
-- Returns current subscription status for the provider.

-- meus_pagamentos_assinatura()
-- Returns subscription payment history for the provider.

-- =====================================================
-- ADMIN RPCs (service_role)
-- =====================================================
-- admin_prestadores_resumo()
-- Admin dashboard summary for providers.

-- admin_inadimplencia_resumo()
-- Admin summary for overdue subscriptions.

-- admin_reativar_assinatura_atual(prestador_id)
-- Reactivates a provider subscription.

-- admin_suspender_assinatura_atual(prestador_id)
-- Suspends a provider subscription.

-- admin_upsert_pagamento_assinatura(...)
-- Inserts/updates subscription payments.

-- admin_marcar_pagamento_pago(...)
-- Marks payment as paid and triggers reactivation flow.

-- admin_recalcular_repasses_pedido(pedido_id)
-- Recomputes commissions and payouts per provider for a given order.

-- admin_set_comissao_default_plataforma(percent)
-- Updates platform default commission with audit trail.

-- admin_blindar_grants_public()
-- Hardens privileges (prevents accidental public grants).

-- admin_auditoria_seguranca_json()
-- Runs security audit and returns PASS=true when production is safe.
