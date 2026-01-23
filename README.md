# Turistei

O **Turistei** é uma plataforma de turismo em desenvolvimento, pensada para conectar **prestadores de serviços turísticos** a viajantes, com foco em organização, transparência e sustentabilidade do negócio.

O projeto está em fase de construção progressiva, com a **base de dados e regras críticas já estruturadas**, antes da implementação do aplicativo.

---

## Visão do Produto

A plataforma foi idealizada para:

- Organizar a oferta de serviços turísticos
- Dar autonomia aos prestadores
- Evitar dependência excessiva de intermediários
- Garantir controle financeiro e operacional
- Escalar sem perder governança

Nenhum dado é apagado por padrão.  
O sistema trabalha com **ativação, suspensão e visibilidade controlada**.

---

## Estado Atual do Projeto

✅ Banco de dados modelado  
✅ Segurança por padrão (RLS forçado)  
✅ Regras de negócio no banco  
✅ Bloqueio automático por inadimplência  
✅ Reativação automática por pagamento  
✅ Pronto para integração com app ou API  

🚧 Frontend ainda não iniciado  
🚧 Integrações externas em planejamento  

---

## Arquitetura Técnica (Resumo)

- **Banco**: PostgreSQL (Supabase)
- **Segurança**: Row Level Security (RLS)
- **Autenticação**: Supabase Auth
- **Modelo**: Ownership por usuário autenticado
- **Busca pública**: View somente leitura
- **Automação**: Triggers, functions e cron

As regras críticas **não dependem do frontend**.

---

## Estrutura de Documentação

A documentação técnica do banco está disponível em:

[docs/database/README.md](docs/database/README.md)

