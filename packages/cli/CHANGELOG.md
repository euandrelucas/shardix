# @shardix/cli

## 0.7.0

### Minor Changes

- # Shardix v0.8.0 — Standardized Monorepo Release

  Standardize all 28 framework packages to version **v0.8.0**.

## 0.6.1

### Patch Changes

- # Fixes for On/Once exports, GatewayRuntime auto-default, and CLI dev template
  - **@shardix/common**: Export `On` and `Once` as explicit functions for typescript `.d.ts` declaration generation.
  - **@shardix/core**: Automatically default `this.runtime` to `GatewayRuntime` when adapter is present, call `adapter.login(token)`, and keep Node.js process event loop active.
  - **@shardix/cli**: Update generator template dev script to `"tsx watch src/main.ts"` and include `"tsx": "^4.19.2"` in `devDependencies`.

## 0.6.0

### Minor Changes

- # Shardix v0.6 — Developer Experience, Plugin Ecosystem & Enterprise Foundations
  - **Plugin Architecture (`@shardix/plugin`)**: Introduced `ShardixPlugin` interface (`register`, `onInit`, `onShutdown`) and `PluginManager` to allow third-party modules to extend Shardix with Controllers, Providers, Commands, and Dashboard pages.
  - **Testing Framework & Mock Layer (`@shardix/testing`)**: Created `createTestingApplication()`, `MockDiscordAdapter`, `mockInteraction()`, and `mockEvent()` for fast, isolated, zero-network unit tests.
  - **Structured Error Hierarchy (`ShardixError`)**: Implemented `ConfigurationError`, `ProviderError`, `RuntimeError`, `InteractionError`, `AdapterError`, `PluginError` with root cause, actionable solution hints, and docs URLs.
  - **CLI 2.0 (`@shardix/cli`)**: Added `shardix dev` (hot reloading server), `shardix benchmark`, `shardix migrate`, `shardix info`, `shardix doctor`, and physical project file generation for `shardix new`.
  - **Security & Rate-Limiting**: Introduced `@RateLimit({ limit, window })` decorator with automatic rate-limit evaluation in `InteractionRouter`.
  - **Official ADRs (0025 to 0028)** & **Enterprise Examples** (`simple-bot`, `large-bot`).

## 0.5.1

### Patch Changes

- fix: write complete project files (package.json, tsconfig.json, shardix.config.ts, .env, .gitignore, Dockerfile, src/main.ts, src/ping.controller.ts, src/user.service.ts) in shardix CLI generator.
