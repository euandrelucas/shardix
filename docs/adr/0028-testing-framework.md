# ADR 0028: Framework de Testes & Mock Discord Layer

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Testar bots de Discord tradicionalmente exige conexão com o Discord real ou simulações manuais complexas de WebSockets.

## Decisão

Criar `@shardix/testing` oferecendo `createTestingApplication()`, `MockDiscordAdapter`, `mockInteraction()` e `mockEvent()` para testes automatizados rápidos e isolados.

## Consequências

- Testes de unidade e integração executados em milissegundos sem depender da API do Discord.
