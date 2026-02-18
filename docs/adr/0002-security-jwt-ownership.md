# ADR 0002 — Segurança: JWT, Ownership e Lifecycle

## Status
Aceito

## Contexto
A Turistei API lida com dados sensíveis de pedidos e valores financeiros.
É necessário garantir que usuários acessem apenas seus próprios dados,
que administradores tenham visibilidade controlada e que o estado dos
pedidos não possa ser corrompido por transições inválidas.

## Decisão
Adotar os seguintes mecanismos de segurança:

1) Autenticação via JWT
- Token JWT emitido no login
- Token obrigatório em todas as rotas protegidas
- Informações de usuário derivadas exclusivamente do token

2) Ownership por usuário
- Usuário comum acessa apenas pedidos vinculados ao seu userId
- Tentativas de acesso a pedidos de terceiros retornam NOT_FOUND
- Admin possui bypass explícito e controlado

3) Controle de lifecycle
- Estados de pedido são explícitos
- Transições inválidas são bloqueadas
- Tentativas inválidas retornam HTTP 409

## Regras
- Nenhuma rota acessa dados sem validação de token
- Controllers não decidem ownership, apenas delegam
- Regras de acesso e transição residem em services
- Segurança é validada por testes automatizados

## Consequências
- Isolamento completo de dados entre usuários
- Redução de risco de vazamento de informações
- Previsibilidade do estado dos pedidos
- Base sólida para auditoria e compliance
