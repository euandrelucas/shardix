# @shardix/oceanicjs

## 0.8.2

### Patch Changes

- e71bb18: feat: Shardix v0.9 — Production Platform

  Transform Shardix from a Discord framework into a full production platform for enterprise bots.

  ## New Packages
  - `@shardix/scheduler` — `@Cron`, `@Interval`, `@Timeout` decorators with a pure Node.js cron parser, `SchedulerRegistry` for runtime control, and graceful shutdown
  - `@shardix/storage` — Storage abstraction with `LocalDriver`, `S3Driver` (compatible with Cloudflare R2, MinIO), streaming support, `copy()`, `move()`, and `presign()`

  ## Major Rewrites
  - `@shardix/provider-health` — Full RFC-compliant health check system. Exposes `/health`, `/ready`, `/live`, `/metrics` (Prometheus format) via a zero-dependency HTTP server. K8s and Docker Compose compatible
  - `@shardix/provider-observability` — Real-time metrics: CPU%, event loop delay, p95 command latency, interactions/s, cache hit ratio. Includes `StructuredLogger`, `Tracer` with correlation IDs, and optional WebSocket push server (port 9090)
  - `@shardix/provider-queue` — Production queue with delay, priority, exponential backoff, dead letter queue, and `@QueueProcessor` decorator
  - `@shardix/provider-eventbus` — Event Bus with wildcard (`*`) and pattern (`user.*`) subscriptions, concurrent emit, and Redis driver interface
  - `@shardix/dashboard-api` — Real metrics backend with WebSocket push, CORS, 10+ REST endpoints, and embedded minimal dashboard UI

  ## CLI Additions (`@shardix/cli`)
  - `shardix profile` — Performance profiler with `--watch`, `--top N`, `--export` flags
  - `shardix audit` — Production readiness audit with scored report (checks env, tsconfig, hardcoded tokens, health provider, etc.)
  - `shardix deploy` — Generates deployment artifacts for Docker, Kubernetes, Railway, Fly.io, and GitHub Actions

  ## Architecture
  - 10 new ADRs (0046–0055) covering: Dashboard, Observability, Scheduler, Queue, Storage, Plugin Marketplace, Production Runtime, OpenTelemetry, Secrets Management, and API Stability

  ## Documentation
  - 14 new guide pages (English and Portuguese)
  - Full v0.9 Production Platform section in sidebar

- Updated dependencies [e71bb18]
  - @shardix/common@0.8.2

## 0.8.0

### Minor Changes

- # Shardix v0.8.0 — Standardized Monorepo Release

  Standardize all 28 framework packages to version **v0.8.0**.

### Patch Changes

- Updated dependencies
  - @shardix/common@0.7.0

## 0.7.1

### Patch Changes

- Updated dependencies
  - @shardix/common@0.6.1

## 0.7.0

### Minor Changes

- # Shardix v0.8 — Complete Discord Platform & Production Engine
  - **Presence System (`PresenceManager`)**: `app.presence.set({ status: 'online', activities: [...] })` decoupled from adapter libraries.
  - **Advanced Builders (`@shardix/common`)**: Added `ActionRowBuilder`, `AttachmentBuilder`, `SlashCommandBuilder`, `ContextMenuBuilder`, `ThreadBuilder`, `RoleBuilder`, `EmojiBuilder`, `StickerBuilder`, `ActivityBuilder`, `WebhookBuilder`, `PermissionBuilder`.
  - **Middleware Pipeline (`MiddlewarePipeline`)**: Request -> Middlewares -> Guards -> Pipes -> Interceptors -> Controller -> Exception Filters -> Response.
  - **Rate Limit Manager (`RateLimitManager`)**: Bucket management & exponential backoff for REST and Gateway.
  - **Official ADRs (0037 to 0045)** & **10 Production Bot Examples**.

### Patch Changes

- Updated dependencies
  - @shardix/common@0.6.0

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
