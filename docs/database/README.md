# Banco de Dados – Turistei

Este documento descreve a arquitetura do banco de dados do projeto Turistei.

## Visão Geral

O banco foi projetado com foco em:
- Segurança por padrão (RLS)
- Regras de negócio no banco
- Nenhuma exclusão física de dados de negócio
- Bloqueio automático por inadimplência
- Reativação automática por pagamento

Tecnologias:
- PostgreSQL
- Supabase
- Row Level Security (RLS)
- Triggers, Functions e Cron

## Entidades Principais

- prestadores
- servicos
- servicos_midias
- planos
- assinaturas
- pagamentos_assinatura

## Princípios Arquiteturais

- O frontend nunca decide permissões
- O banco é a autoridade final
- Views públicas são somente leitura
- Usuários só acessam dados próprios
- Processos críticos são automatizados

## Estado Atual

- Modelagem finalizada
- RLS ativo e forçado
- Ownership aplicado
- Automação financeira ativa
- Banco pronto para integração com app
