# ADR 0039: Arquitetura da API REST desacoplada

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Expor endpoints REST desacoplados (`app.rest.guilds`, `app.rest.channels`, `app.rest.members`, `app.rest.roles`) sem expor chamadas do adaptador.

## Decisão

Prover um cliente HTTP nativo do Shardix com controle automático de cabeçalhos de autorização e rate limits.
