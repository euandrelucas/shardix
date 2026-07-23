# ADR 0042: Pipeline de Middlewares

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Executar transformações de payload, logging, validações e tratamentos de erro em sequência.

## Decisão

Adicionar o `MiddlewarePipeline` garantindo a ordem: `Middlewares -> Guards -> Pipes -> Interceptors -> Controller -> Exception Filters`.
