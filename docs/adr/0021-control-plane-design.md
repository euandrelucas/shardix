# ADR 0021: Design do Control Plane e Sharding Automático

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe de Arquitetura Shardix

## Contexto

Quando múltiplos trabalhadores (Workers) são iniciados em um cluster sem sharding explícito, o Gateway do Discord envia eventos duplicados para todas as instâncias conectadas à mesma fatia de websocket.

## Decisões Arquiteturais

### 1. Cálculo Automático de Sharding
- O `ClusterManager` calcula e injeta dinamicamente a fatia de Shards de cada Worker: `shardId = workerIndex`, `totalShards = totalWorkers`.
- Cada trabalhador é registrado no cliente da biblioteca Discord com a sua fatia de Shard isolada.

## Consequências

- Eliminação de duplicidade de eventos em clusters de grande escala.
