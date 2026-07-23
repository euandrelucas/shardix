# ADR 0044: Rate Limit Manager

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Evitar travamentos da API do Discord aplicando gerenciamento de buckets e backoff exponencial.

## Decisão

Adicionar o `RateLimitManager` integrado ao `ShardixRestClient` e `GatewayRuntime`.
