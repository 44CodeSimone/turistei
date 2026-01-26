-- =====================================================
-- TURISTEI - CORE DATABASE STRUCTURE
-- PostgreSQL / Supabase
-- Marketplace multi-fornecedor com financeiro automatizado
-- =====================================================

-- =========================
-- PRESTADORES
-- =========================
CREATE TABLE prestadores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    nome text NOT NULL,
    email text,
    telefone text,
    comissao_override_percent numeric(5,2),
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- =========================
-- SERVICOS
-- =========================
CREATE TABLE servicos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prestador_id uuid NOT NULL REFERENCES prestadores(id),
    titulo text NOT NULL,
    descricao text,
    preco numeric(12,2) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- =========================
-- SERVICOS MIDIAS
-- =========================
CREATE TABLE servicos_midias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servico_id uuid NOT NULL REFERENCES servicos(id),
    url text NOT NULL,
    ordem int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
