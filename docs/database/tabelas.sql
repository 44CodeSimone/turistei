-- =====================================================
-- TURISTEI - CORE DATABASE STRUCTURE
-- Marketplace multi-fornecedor (backend em Supabase)
-- =====================================================

-- ====================================
-- Tabela de Prestadores de Serviço
-- ====================================
CREATE TABLE prestadores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    nome text NOT NULL,
    email text,
    telefone text,
    comissao_override_percent numeric(5,2),
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Tabela de Serviços por Prestador
-- ====================================
CREATE TABLE servicos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE RESTRICT,
    titulo text NOT NULL,
    descricao text,
    preco numeric(12,2) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Tabela de Mídias dos Serviços
-- ====================================
CREATE TABLE servicos_midias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    servico_id uuid NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
    url text NOT NULL,
    ordem integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
