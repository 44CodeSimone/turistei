# Turistei — Roadmap Técnico

Este roadmap descreve a evolução planejada do projeto Turistei,
respeitando hierarquia, camadas e qualidade Big Tech.

---

## FASE 1 — Backend Core (CONCLUÍDA)
- API Node.js + Express
- Arquitetura em camadas
- Auth JWT (user / admin)
- Marketplace multi-fornecedor
- Financeiro por item
- Lifecycle validado
- Ownership isolado
- Testes automatizados
- Documentação técnica (ENDPOINTS + ADRs)

Status: ✔️ Concluída

---

## FASE 2 — Frontend / App
Objetivo:
- Consumir a API existente sem alterar regras de negócio.

Itens:
- Frontend web (dashboard admin + usuário)
- Autenticação via JWT
- Listagem e criação de pedidos
- Visualização de lifecycle e financeiro

Status: ⏳ Planejada

---

## FASE 3 — Persistência em Banco
Objetivo:
- Substituir persistência em arquivo por banco relacional.

Itens:
- Implementação de repository para banco (ex.: Supabase)
- Migração transparente (sem alterar services/controllers)
- Manutenção dos testes existentes

Status: ⏳ Planejada

---

## FASE 4 — Pagamentos
Objetivo:
- Tornar o marketplace operacional financeiramente.

Itens:
- Integração com gateway de pagamento (Pix / cartão)
- Confirmação automática de pagamento
- Recalculo de comissões e repasses

Status: ⏳ Planejada

---

## FASE 5 — Evoluções
Itens possíveis:
- Observabilidade avançada
- Notificações
- Camada social
- IA para atendimento e recomendação

Status: ⏳ Futuro
