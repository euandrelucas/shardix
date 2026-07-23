# @shardix/core

## 0.4.0

### Minor Changes

- # Shardix v0.6 — Developer Experience, Plugin Ecosystem & Enterprise Foundations
  - **Plugin Architecture (`@shardix/plugin`)**: Introduced `ShardixPlugin` interface (`register`, `onInit`, `onShutdown`) and `PluginManager` to allow third-party modules to extend Shardix with Controllers, Providers, Commands, and Dashboard pages.
  - **Testing Framework & Mock Layer (`@shardix/testing`)**: Created `createTestingApplication()`, `MockDiscordAdapter`, `mockInteraction()`, and `mockEvent()` for fast, isolated, zero-network unit tests.
  - **Structured Error Hierarchy (`ShardixError`)**: Implemented `ConfigurationError`, `ProviderError`, `RuntimeError`, `InteractionError`, `AdapterError`, `PluginError` with root cause, actionable solution hints, and docs URLs.
  - **CLI 2.0 (`@shardix/cli`)**: Added `shardix dev` (hot reloading server), `shardix benchmark`, `shardix migrate`, `shardix info`, `shardix doctor`, and physical project file generation for `shardix new`.
  - **Security & Rate-Limiting**: Introduced `@RateLimit({ limit, window })` decorator with automatic rate-limit evaluation in `InteractionRouter`.
  - **Official ADRs (0025 to 0028)** & **Enterprise Examples** (`simple-bot`, `large-bot`).

### Patch Changes

- Updated dependencies
  - @shardix/common@0.4.0
  - @shardix/transport@0.1.3

## 0.3.0

### Minor Changes

- feat: add @Event, @On, and @Once native event decorators, typed Gateway event listening, and dynamic module loading for Discord.js, Eris, Oceanic.js, and Discordeno adapters.

### Patch Changes

- Updated dependencies
  - @shardix/common@0.3.0
  - @shardix/transport@0.1.2

## 0.2.0

### Minor Changes

- cdcfac3: Release v0.5.0: Introduce Control Plane Dashboard, Automatic Shard Calculation per Worker, Multi-Library Adapters (Eris, Oceanic.js, Discordeno), and CI/CD Release Pipeline.

### Patch Changes

- Updated dependencies [cdcfac3]
  - @shardix/common@0.2.0
  - @shardix/transport@0.1.1
