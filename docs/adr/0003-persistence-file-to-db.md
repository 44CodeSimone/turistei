# ADR 0003 — Persistência: Arquivo → Banco de Dados

## Status
Aceito

## Contexto
Durante a fase inicial, o objetivo é validar regras de negócio, lifecycle,
ownership e financeiro com o menor acoplamento possível à infraestrutura.
Ao mesmo tempo, a solução precisa estar preparada para migração futura
para banco de dados relacional sem reescrita do core.

## Decisão
Adotar persistência em arquivo (DEV) com desacoplamento por repositório,
permitindo evolução transparente para banco de dados.

- Persistência atual: arquivo JSON
- Acesso a dados exclusivamente via repositories
- Nenhuma regra de negócio depende do mecanismo físico de storage

## Regras
- Services nunca acessam storage diretamente
- Repositories expõem contrato estável
- Troca de persistência não altera controllers ou services
- Backups automáticos garantem segurança em DEV

## Evolução Planejada
- Substituir file-repository por implementação em banco (ex.: Supabase)
- Manter a mesma interface de repositório
- Preservar regras de negócio e testes existentes

## Consequências
- Desenvolvimento rápido e seguro em fase inicial
- Baixo risco na migração para banco
- Código preparado para produção sem retrabalho
