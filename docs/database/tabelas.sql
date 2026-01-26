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

-- ====================================
-- Tabela de Planos da Plataforma
-- ====================================
CREATE TABLE planos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    descricao text,
    limite_servicos integer,
    limite_midias integer,
    permite_video boolean DEFAULT false,
    destaque boolean DEFAULT false,
    preco_mensal numeric(12,2) NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Tabela de Assinaturas dos Prestadores
-- ====================================
CREATE TABLE assinaturas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE RESTRICT,
    plano_id uuid NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
    status text NOT NULL,
    inicio_em date NOT NULL,
    fim_em date,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Tabela de Pedidos (cabeçalho)
-- ====================================
CREATE TABLE pedidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    turista_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    valor_bruto numeric(12,2) NOT NULL DEFAULT 0,
    valor_final numeric(12,2) NOT NULL DEFAULT 0,
    status text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Tabela de Itens do Pedido (por prestador)
-- ====================================
CREATE TABLE pedidos_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE RESTRICT,
    servico_id uuid NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
    quantidade integer NOT NULL DEFAULT 1,
    preco_unitario numeric(12,2) NOT NULL,
    valor_total numeric(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Pagamentos dos Pedidos
-- ====================================
CREATE TABLE pagamentos_pedido (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    valor numeric(12,2) NOT NULL,
    status text NOT NULL,
    metodo text,
    pago_em timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Comissões da Plataforma por Item
-- ====================================
CREATE TABLE comissoes_itens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_item_id uuid NOT NULL REFERENCES pedidos_itens(id) ON DELETE RESTRICT,
    prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE RESTRICT,
    percentual numeric(5,2) NOT NULL,
    valor numeric(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ====================================
-- Repasses Financeiros por Prestador
-- ====================================
CREATE TABLE repasses_prestador (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    prestador_id uuid NOT NULL REFERENCES prestadores(id) ON DELETE RESTRICT,
    valor_bruto numeric(12,2) NOT NULL,
    comissao_plataforma_valor numeric(12,2) NOT NULL,
    valor_liquido numeric(12,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);
