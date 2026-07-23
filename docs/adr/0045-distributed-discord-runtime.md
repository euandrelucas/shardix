# ADR 0045: Distributed Discord Runtime Complete

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Sincronizar eventos, cache, presença e conexões em ambiente distribuído com múltiplos workers.

## Decisão

Integrar `ShardixApplication` com o `@shardix/runtime-distributed` e barramento `@shardix/ipc`.
