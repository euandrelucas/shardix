# ADR 0037: Arquitetura Interna do Gateway Runtime

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Manter conexões WebSocket com o Discord exige controle de Heartbeats, Resume, Identify, Compressão e Gerenciamento de Shards.

## Decisão

Implementar o `GatewayRuntime` abstraído no Core gerenciando reconexão assíncrona com zero dependência externa.
