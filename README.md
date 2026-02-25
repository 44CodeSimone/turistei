# Turistei API

API do projeto **Turistei** — marketplace de turismo **multi-fornecedor**, com
financeiro **por item**, comissão dinâmica da plataforma e **repasses isolados por prestador**.

**Status atual:** CHECKPOINT FECHADO  
(Testes 100% verdes, comportamento validado ponta-a-ponta)

---

## Visão Geral

O Turistei é um marketplace SaaS com regras financeiras rígidas:

- Cada item pertence financeiramente a um prestador
- Comissão calculada **por item**
- Repasses nunca se misturam
- Histórico completo de eventos
- Transições de estado validadas (lifecycle)
- Ownership isolado (usuário vê apenas seus pedidos; admin vê tudo)

Este repositório contém **a API local**, usada como base técnica do produto.

---

## Requisitos

- Node.js **18+**
- PowerShell (Windows)
- Porta local: **3000**

---

## Estrutura do Projeto

- `src/` — código da API  
  Camadas obrigatórias:  
  `routes → controllers → services → repositories`

- `tools/` — scripts de teste e utilidades
- `docs/` — documentação técnica (OpenAPI, ERP mínimo, testes)
- `backups/` — backups automáticos do storage
- `pedido.json` — persistência local (DEV)
- `legacy/` — scripts e artefatos históricos (não fazem parte do core)

---

## Variáveis de Ambiente

Arquivo: `.env`

### Obrigatórias em produção
- `JWT_SECRET` — **OBRIGATÓRIA**  
  > A aplicação **não sobe** em modo produção sem esta variável.

### Opcionais
- `TURISTEI_PLATFORM_COMMISSION_PERCENT`  
  Percentual padrão de comissão da plataforma (ex.: 15)

- `TURISTEI_BACKUP_KEEP`  
  Quantidade de backups mantidos (padrão: 30)

> ⚠️ Nunca commitar o arquivo `.env`.

---

## Rodar em Desenvolvimento

Em desenvolvimento, é permitido fallback controlado de `JWT_SECRET`.

```powershell
npm run start:dev
