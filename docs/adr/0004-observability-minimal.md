# ADR 0004 — Observabilidade Mínima

## Status
Aceito

## Contexto
Em produção, é necessário ter visibilidade mínima sobre o comportamento
da API sem introduzir complexidade excessiva ou exposição de dados sensíveis.

O objetivo não é monitoramento avançado, mas observabilidade suficiente
para diagnóstico básico e auditoria operacional.

## Decisão
Adotar observabilidade mínima baseada em logs estruturados e condicionais.

- Logs apenas em pontos críticos (login, criação de pedido, transição de status)
- Logs condicionais por flag de ambiente
- Nenhum dado sensível (PII) registrado
- Logs desativados por padrão em DEV

## Regras
- Logs controlados por variável de ambiente (ex.: TURISTEI_OBS=1)
- Logs não devem alterar fluxo ou contratos da API
- Nenhuma dependência externa obrigatória
- Observabilidade não interfere nos testes existentes

## Consequências
- Diagnóstico rápido de falhas básicas
- Baixo impacto em performance
- Base preparada para futura integração com ferramentas de monitoramento
