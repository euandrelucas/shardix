# ADR 0029: Arquitetura de Adaptação Desacoplada do Discord

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Aplicações tradicionais em Node.js ficam presas (vendor lock-in) a uma biblioteca específica como `discord.js`, `Eris` ou `Discordeno`.

## Decisão

Isolar completamente a camada de biblioteca externa atrás da abstração `DiscordAdapter`. Toda a regra de negócio se comunica apenas com as interfaces do Shardix.

## Consequências

- Alternar adaptadores é feito apenas trocando o parâmetro `adapter` no `ShardixFactory.create()`.
- Zero linhas de código da aplicação são alteradas ao trocar de biblioteca.
