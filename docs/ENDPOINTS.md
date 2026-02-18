# Turistei API — Endpoints e Contratos

Base URL (DEV/LOCAL):
- http://localhost:3000

Autenticação:
- Bearer Token (JWT) no header:
  Authorization: Bearer <token>

---

## Health

### GET /health
Objetivo:
- Verificar se a API está no ar.

Resposta 200:
```json
{ "ok": true, "api": "turistei" }
