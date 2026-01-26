# Arquitetura do Turistei

Marketplace multi-fornecedor com financeiro automatizado no PostgreSQL (Supabase)

Core:
- Segurança via RLS + FORCE RLS
- Regras de negócio no banco
- Histórico financeiro imutável
- Comissões por item
- Repasses por prestador

Tabelas principais:
prestadores
servicos
pedidos
pedidos_itens
pagamentos_pedido
comissoes_itens
repasses_prestador
