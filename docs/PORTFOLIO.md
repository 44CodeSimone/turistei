# Turistei API — Portfólio Técnico

## Visão Geral
A Turistei API é o backend de um marketplace de turismo multi-fornecedor,
desenvolvido com foco em arquitetura limpa, segurança, auditabilidade e
evolução progressiva em padrão Big Tech.

O projeto foi construído para suportar pedidos com múltiplos prestadores,
comissões por item e repasses financeiros isolados, mantendo histórico
completo de eventos e regras de negócio explícitas.

---

## Problema Resolvido
Marketplaces de turismo normalmente misturam caixa, simplificam o financeiro
ou não conseguem auditar corretamente pedidos com múltiplos fornecedores.

A Turistei API resolve:
- Separação financeira por item e por prestador
- Comissão calculada individualmente
- Ciclo de vida de pedidos controlado e validado
- Segurança de acesso por ownership
- Base sólida para crescimento (frontend, app, integrações)

---

## Arquitetura
Arquitetura obrigatoriamente em camadas:

routes → controllers → services → repositories → storage

Princípios adotados:
- Nenhuma lógica fora da camada correta
- Mudanças mínimas (menor diff possível)
- Código testável e auditável
- Persistência desacoplada (arquivo hoje, banco amanhã)

---

## Funcionalidades Implementadas
- Autenticação JWT (login, auth/me)
- Perfis de usuário e administrador
- Marketplace multi-fornecedor real
- Financeiro por item (comissão + repasse)
- Histórico de eventos por pedido
- Ciclo de vida completo:
  CREATED → PAID → CONFIRMED → COMPLETED / CANCELLED
- Bloqueio de transições inválidas (HTTP 409)
- Isolamento de pedidos por usuário (ownership)
- Bypass administrativo controlado

---

## Segurança
- JWT com hardening de ambiente
- JWT_SECRET obrigatório em produção
- Falha explícita em ambiente mal configurado
- Separação clara entre DEV e PROD-like

---

## Testes e Qualidade
- Testes automatizados cobrindo:
  - API (health, auth, orders)
  - Ownership (isolamento de dados)
  - Lifecycle (transições válidas e inválidas)
- Execução única:
  npm run test:all
- Testes 100% verdes no checkpoint final

---

## Persistência e Auditoria
- Persistência local via pedido.json (DEV)
- Backups automáticos com rotação
- Estrutura preparada para banco relacional (Supabase)
- Regras de negócio recalculáveis e auditáveis

---

## Estado Atual
- Core backend concluído
- Arquitetura validada
- Segurança mínima de produção validada
- Pronto para:
  - Frontend / App
  - Integrações de pagamento
  - Banco de dados real
  - Evolução de produto

---

## Observação Final
Este projeto prioriza engenharia correta antes de escala.
O objetivo não é apenas “funcionar”, mas manter integridade,
clareza e evolução segura ao longo do tempo.
