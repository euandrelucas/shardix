# ADR 0031: Arquitetura do Universal Cache Layer (`ShardixCacheManager`)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Depender do cache interno da biblioteca limita a migração entre adaptadores e a execução em clusters distribuídos.

## Decisão

Fornecer o `ShardixCacheManager` acessível via `app.cache.guild(id)`, `app.cache.channel(id)`, `app.cache.member(guildId, userId)`.
