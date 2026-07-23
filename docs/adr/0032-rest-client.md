# ADR 0032: Cliente REST Próprio (`ShardixRestClient`)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Requisições HTTP para a API REST do Discord devem seguir o rate limit oficial e serem executáveis independentemente do adaptador ativo.

## Decisão

Expor `app.rest` com namespaces tipados para `guilds`, `channels`, `members`, `roles` e `interactions`.
