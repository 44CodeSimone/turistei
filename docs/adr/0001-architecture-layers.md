# ADR 0001 — Arquitetura em Camadas Obrigatória

## Status
Aceito

## Contexto
O Turistei é um marketplace multi-fornecedor com regras financeiras sensíveis
(comissão por item, repasses isolados, lifecycle de pedidos e ownership).
Sem uma arquitetura clara, o risco de acoplamento e regressões é alto.

## Decisão
Adotar arquitetura estritamente em camadas:

routes → controllers → services → repositories → storage

Cada camada tem responsabilidade única:
- routes: definição de endpoints e middlewares
- controllers: validação de entrada e saída HTTP
- services: regras de negócio
- repositories: acesso a dados
- storage: mecanismo físico (arquivo ou banco)

## Regras
- É proibido pular camadas
- Nenhuma lógica de negócio fora de services
- Persistência nunca acessada diretamente por controllers
- Mudanças devem ter menor diff possível

## Consequências
- Código mais previsível e testável
- Facilidade de troca de persistência (arquivo → banco)
- Menor risco de regressões
- Curva de aprendizado clara para novos contribuidores
