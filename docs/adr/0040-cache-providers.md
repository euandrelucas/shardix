# ADR 0040: Provedores de Cache & Sincronização

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Manter cache sincronizado de entidades do Discord em memória (LRU/TTL) ou Redis.

## Decisão

Adicionar o `MemoryCacheProvider` e `RedisCacheProvider` integrados ao `ShardixCacheManager`.
