# Turistei API

API do projeto **Turistei** — marketplace de turismo multi-fornecedor com
financeiro por item, comissão dinâmica e repasses isolados por prestador.

Status atual: **CHECKPOINT FECHADO** (testes 100% verdes).

---

## Requisitos
- Node.js 18+
- PowerShell (Windows)
- Porta local: **3000**

---

## Estrutura
- `src/` — código da API (camadas: routes → controllers → services → repositories)
- `tools/` — scripts de teste e utilidades
- `docs/` — documentação (OpenAPI, ERP mínimo)
- `backups/` — backups automáticos do `pedido.json`
- `pedido.json` — persistência local (DEV)

---

## Variáveis de Ambiente
Arquivo: `.env`

Obrigatórias em **produção**:
- `JWT_SECRET` — **OBRIGATÓRIA** (sem fallback)

Opcionais:
- `TURISTEI_PLATFORM_COMMISSION_PERCENT` — percentual de comissão da plataforma
- `TURISTEI_BACKUP_KEEP` — quantidade de backups mantidos (padrão: 30)

> ⚠️ Nunca commitar `.env`.

---

## Rodar em Desenvolvimento
Usa fallback de `JWT_SECRET` **apenas em DEV**.

```powershell
npm run start:dev
