# Turistei API (Big Tech Real)

API local do projeto **Turistei** (marketplace de turismo multi-fornecedor), com:
- pedidos multi-fornecedor reais
- comissão por item
- repasses separados por prestador
- histórico de eventos
- autenticação JWT hardened
- ownership (isolamento por usuário) validado
- lifecycle do pedido com guard (transições inválidas bloqueadas)

## Arquitetura obrigatória (camadas)
routes  controllers  services  repositories  storage

Regras:
- nunca pular camada
- nenhuma lógica fora do lugar
- mudanças mínimas
- se está funcionando e testado: NÃO MEXER

## Requisitos
- Node.js
- NPM

## Configuração (.env)
JWT_SECRET=SEU_SEGREDO_FORTE_AQUI  
TURISTEI_PLATFORM_COMMISSION_PERCENT=15

## Rodar API
npm start  
npm run start:dev

Base URL: http://localhost:3000

## Rotas principais
/health  
/auth/login  
/auth/me  

/services  
/providers  
/providers/:id/services  

/orders (POST, GET)  
/orders/:id (GET)

/orders/:id/pay  
/orders/:id/confirm  
/orders/:id/complete  
/orders/:id/cancel  

## Testes Big Tech (1 comando)
npm run test:all

Inclui:
- API
- Ownership
- Lifecycle

## Dados
pedido.json  ativo  
backups/  histórico seguro  

## Status
API estável, segura, auditada e validada
