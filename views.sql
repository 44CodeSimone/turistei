-- =====================================================
-- TURISTEI - VIEWS (PRODUCTION MIRROR)
-- Public catalog must be exposed ONLY via views (read-only).
-- =====================================================

-- -----------------------------------------------------
-- v_servicos_busca (public read-only search view)
-- Note: This mirrors the production definition captured from the database.
-- -----------------------------------------------------
CREATE OR REPLACE VIEW public.v_servicos_busca AS
SELECT
  s.id,
  s.created_at,
  s.prestador_id,
  s.titulo,
  s.descricao,
  s.valor_base,
  s.ativo
FROM public.servicos s
JOIN public.prestadores p
  ON p.id = s.prestador_id
JOIN LATERAL (
  SELECT a.status
  FROM public.assinaturas a
  WHERE a.prestador_id = p.id
  ORDER BY a.created_at DESC
  LIMIT 1
) ultima_assinatura ON true
WHERE ultima_assinatura.status = ANY (ARRAY['ativa'::text, 'tolerancia'::text]);
