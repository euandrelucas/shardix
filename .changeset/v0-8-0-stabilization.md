---
'@shardix/common': major
'@shardix/core': major
'@shardix/transport': major
'@shardix/discordjs': major
'@shardix/eris': major
'@shardix/oceanicjs': major
'@shardix/discordeno': major
'@shardix/testing': major
'@shardix/provider-cache': major
'@shardix/provider-config': major
'@shardix/provider-eventbus': major
'@shardix/provider-health': major
'@shardix/provider-logger': major
'@shardix/provider-observability': major
'@shardix/provider-queue': major
'@shardix/provider-dashboard': major
'@shardix/cli': major
---

# Shardix v0.8.0 — Major Stabilization Release

## 🚀 What's New

This is a major stabilization release that fixes critical runtime bugs and ensures all packages work correctly together.

## Core Framework (`@shardix/core`, `@shardix/common`)

- **Fixed double-login bug** in `ShardixApplication.start()` — the adapter is no longer called twice when using `GatewayRuntime`
- **Fixed `dotenv` loading** — environment variables now load reliably before adapter initialization
- **Added `keepAlive` interval** — bots no longer exit immediately after starting; graceful shutdown via `SIGINT`/`SIGTERM` is handled automatically
- **Added `setAdapter()` to `InteractionRouter`** — adapter reference is now properly wired from construction
- **Improved `getCommandData()`** — returns all registered slash command data for external registration scripts
- **Fixed `InteractionRouter`** — now handles `Button`, `SelectMenu`, `Modal`, and `Autocomplete` interactions correctly with proper `component_type` mapping

## Discord.js Adapter (`@shardix/discordjs`)

- **Rewrote `DiscordJSAdapter`** — native interaction references are now stored and used for replies
- **Native `reply()` support** — interactions are replied to using `interaction.reply()` directly (no more REST-only fallback)
- **Proper `deferReply()` and `editReply()`** support via `CommandContext`
- **Fixed `registerRawHandler`** type signature to allow response data passthrough

## Transport (`@shardix/transport`)

- **Rewrote `GatewayTransport`** — now manages adapter login correctly, preventing double login
- **Simplified interaction forwarding** — native adapter handles replies; no REST roundtrip needed

## CommandContext (`@shardix/common`)

- **Added `_nativeInteraction` reference** — enables access to the raw Discord.js/Eris/etc interaction object
- **Added `awaitButton()`, `awaitModal()`, `awaitSelect()`** — component collection helpers
- **Improved `reply()`, `defer()`, `editReply()`, `followUp()`** to use native interaction when available

## CLI (`@shardix/cli`)

- **Improved project generation** — generated projects now include:
  - Proper `.env` setup with `dotenv.config()` called first in `main.ts`
  - `register-commands.ts` script for slash command registration
  - Full `@Module` pattern with example service and controller
  - Working `tsconfig.json` with `experimentalDecorators` and `emitDecoratorMetadata`
- **Interactive dependency installation** — CLI asks to install dependencies after project generation
- **Detects package manager** — supports npm, pnpm, yarn, and bun

## Providers (all providers updated to 0.8.0)

- All providers (`cache`, `config`, `eventbus`, `health`, `logger`, `observability`, `queue`, `dashboard`) are now at `0.8.0`
- Consistent API with the rest of the framework

## Breaking Changes

- `DiscordAdapter.registerRawHandler()` now accepts a handler returning `any` (was `void | Promise<void>`) to allow response data forwarding
- `GatewayTransport` constructor now requires an `options` object: `new GatewayTransport({ adapter, token? })`
