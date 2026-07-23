# @shardix/testing

## 0.7.2

### Patch Changes

- Updated dependencies
  - @shardix/common@0.6.0
  - @shardix/core@0.6.0

## 0.7.1

### Patch Changes

- Updated dependencies
  - @shardix/common@0.5.0
  - @shardix/core@0.5.0

## 0.7.0

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
  - @shardix/core@0.4.0
