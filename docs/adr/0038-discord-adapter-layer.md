# ADR 0038: Camada de Adaptação de Adaptadores

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Diferentes bibliotecas (`discord.js`, `Eris`, `Discordeno`, `OceanicJS`) possuem estruturas de eventos distintas.

## Decisão

Todos os adaptadores convertem tipos proprietários para as abstrações universais do Shardix (`CommandContext`, `ShardixMessage`, `EmbedBuilder`).
