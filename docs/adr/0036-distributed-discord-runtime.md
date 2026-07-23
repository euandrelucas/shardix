# ADR 0036: Distributed Discord Runtime

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Garantir que a plataforma Discord funcione em clusters com múltiplos workers sincronizando cache e requisições via IPC e Redis.

## Decisão

Integrar `ShardixCacheManager` e `ShardixRestClient` com o `@shardix/runtime-distributed`.
