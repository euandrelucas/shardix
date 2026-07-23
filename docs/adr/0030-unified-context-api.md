# ADR 0030: Unified Context API (`CommandContext`)

* **Status**: Aprovado
* **Data**: 2026-07-23
* **Autores**: Equipe Shardix Core

## Contexto

Diferentes bibliotecas possuem estruturas distintas para eventos e interações (`ChatInputCommandInteraction`, `Message`, `CommandInteraction`).

## Decisão

Injetar uma instância única de `CommandContext` nos métodos decorados com `@SlashCommand`, `@Button`, `@SelectMenu`, `@Modal`.

## Consequências

- Métodos de resposta padronizados: `ctx.reply()`, `ctx.defer()`, `ctx.editReply()`, `ctx.followUp()`.
