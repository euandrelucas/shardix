# ADR 0034: Sistema de Builders Fluentes (`EmbedBuilder`, `ButtonBuilder`, etc.)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Criar embeds e componentes sem depender do `discord.js` exige builders desacoplados no `@shardix/common`.

## Decisão

Fornecer `EmbedBuilder`, `ButtonBuilder`, `SelectMenuBuilder`, `ModalBuilder`, `PollBuilder` e `MessageBuilder`.
