# ADR 0022: Modelo de Segurança do Dashboard

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

A API do Dashboard expõe métricas operacionais, logs e status de infraestrutura que não podem ser abertos publicamente sem controle de acesso.

## Decisões Arquiteturais

### 1. Autenticação via Token (`SHARDIX_DASHBOARD_TOKEN`)
- Todos os endpoints sob `/api/*` requerem o cabeçalho `Authorization: Bearer <token>`.
- Mascaramento estrito de variáveis de ambiente (`DISCORD_TOKEN`, `REDIS_URL`, etc.).

## Consequências

- Segurança de nível corporativo para visualizações administrativas.
