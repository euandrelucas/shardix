# @shardix/discordeno

## 0.6.0

### Minor Changes

- # Shardix v0.7 — Discord Platform Implementation
  - **Unified Context API (`CommandContext`)**: Decoupled interaction & message context exposing `ctx.reply()`, `ctx.defer()`, `ctx.editReply()`, `ctx.followUp()`, `ctx.guild`, `ctx.member`, `ctx.channel`, `ctx.user`, `ctx.permissions`, `ctx.locale`.
  - **Universal Builders**: Introduced `EmbedBuilder`, `ButtonBuilder`, `SelectMenuBuilder`, `ModalBuilder`, `PollBuilder`, `MessageBuilder`.
  - **Shardix REST Client (`ShardixRestClient`)**: Rate-limit aware REST client with typed endpoints (`app.rest.guilds`, `app.rest.channels`, `app.rest.members`, `app.rest.roles`).
  - **Universal Cache Layer (`ShardixCacheManager`)**: Memory & Redis cache manager (`app.cache.guild(id)`, `app.cache.channel(id)`, `app.cache.user(id)`).
  - **Collector System (`CollectorManager`)**: `ComponentCollector` and async `awaitComponent()`.
  - **Permission Pipeline**: Added `@Permissions()`, `@BotPermissions()`, `@GuildOnly()`, `@DMOnly()`, `@NSFW()`, `@OwnerOnly()`, `@DeveloperOnly()`, `@Cooldown()`, `@Concurrency()`, `@Catch()`, `@UseFilters()`.
  - **Voice Foundation**: `VoiceState`, `VoiceConnection`, `AudioPlayer` base models.
  - **ADRs (0029 to 0036)**.

### Patch Changes

- Updated dependencies
  - @shardix/common@0.5.0

## 0.5.1

### Patch Changes

- Updated dependencies
  - @shardix/common@0.4.0

## 0.5.0

### Minor Changes

- feat: add @Event, @On, and @Once native event decorators, typed Gateway event listening, and dynamic module loading for Discord.js, Eris, Oceanic.js, and Discordeno adapters.

### Patch Changes

- Updated dependencies
  - @shardix/common@0.3.0

## 0.4.1

### Patch Changes

- Updated dependencies [cdcfac3]
  - @shardix/common@0.2.0
