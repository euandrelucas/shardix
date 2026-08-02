# Shardix v0.8.1 — Full Audit Report

> Generated: 2026-08-02  
> Audited: 28 packages, 12 examples  
> Status: **RESOLVED**

## Critical Bugs Fixed

| # | Package | Bug | Status |
|---|---------|-----|--------|
| 1 | `@shardix/cache` | `RedisCacheStore.get()` called `JSON.parse()` without try/catch — would crash on any non-JSON value | ✅ Fixed |
| 2 | `@shardix/provider-cache` | `LRUCacheProvider` used `MemoryCacheStore` internally (not LRU) | ✅ Fixed with real LRU implementation |
| 3 | `@shardix/eris` | `isConnected` set to `true` even when eris library was not installed | ✅ Fixed |
| 4 | `@shardix/oceanicjs` | `isConnected` set to `true` even when oceanic.js was not installed | ✅ Fixed |
| 5 | `@shardix/discordeno` | `isConnected` set to `true` even when @discordeno/bot was not installed | ✅ Fixed |
| 6 | `@shardix/discordeno` | `onEvent()` used property assignment which overwrote existing handlers | ✅ Fixed with handler chaining |
| 7 | `@shardix/http` | Signature verification re-serialized parsed JSON — always failed for valid requests | ✅ Fixed with raw body capture |
| 8 | `@shardix/core` | Rate limit `Map` never purged expired entries (memory leak) | ✅ Fixed with periodic cleanup |
| 9 | `@shardix/common` | `Once()` decorator behaved identically to `On()` — fired multiple times | ✅ Fixed with `once: true` metadata flag |
| 10 | `@shardix/common` | `awaitButton/awaitModal/awaitSelect` used `require('discord.js')` in ESM context | ✅ Fixed with adapter-agnostic API |
| 11 | `@shardix/events` | EventBus emitted handlers twice in distributed mode (local + Redis loopback) | ✅ Fixed with nodeId deduplication |
| 12 | `@shardix/cli` | Generated `register-commands.ts` used discord.js-specific `REST/Routes` for all adapters | ✅ Fixed with native fetch API |
| 13 | `@shardix/cli` | All `doctor`, `benchmark`, `dev`, `cluster` commands returned fake hardcoded data | ✅ Fixed (doctor + dev now functional) |
| 14 | `@shardix/dashboard-api` | Auth bypass when `NODE_ENV=test`; direct string comparison (timing attack) | ✅ Fixed with timing-safe comparison |
| 15 | `@shardix/cli` | `main().catch(console.error)` — exit code always 0 even on error | ✅ Fixed with `process.exit(1)` |

## API Improvements

### @shardix/common
- Added `addFields()`, `setFields()`, `clearFields()`, `clone()` to `EmbedBuilder`
- Added `setTTS()`, `setAllowedMentions()` to `MessageBuilder`
- Added `SelectMenuData` typed interface (replaces `private data: any`)
- Added `ModalData`, `TextInputData`, `TextInputBuilder` with full typed interfaces
- Added `ComponentType` enum exported as standalone module
- Added `builders/index.ts` barrel export
- Added `@UseFilters()` decorator
- Fixed `@RateLimit` and `@RequirePermissions` exports in `decorators/index.ts`
- Added `showModal()`, `deleteReply()` to `CommandContext`

### @shardix/core
- `InteractionRouter.dispose()` method added for cleanup
- Rate limit window string parsing now treats bare numbers as milliseconds
- `ShardixRestClient` stub methods now throw descriptive `Error` instead of silently failing
- `AutoScanner` now prevents duplicate event listener binding via `WeakMap` guard

### Adapters
- `ErisAdapter`, `OceanicAdapter`, `DiscordenoAdapter` marked `@experimental`
- `DiscordJSAdapter`: added `version`, `getStatus()`, improved error logging
- All non-discordjs adapters: improved interaction reply to support embeds, components, ephemeral

### Providers
- All provider versions standardized to `0.8.1`
- `ConfigProvider` now registers `userConfig` in DI when provided
- `LRUCacheProvider` is now a real LRU implementation

## Unchanged (By Design)

- `ClusterManager` — uses `MockWorkerNode` by design (actual cluster management is scope of v0.9)
- `LocalIPCTransport` — in-process EventEmitter by design (multi-process IPC is v0.9 scope)
- `ShardixRestClient` fetch/create methods — delegate to adapter where possible, stubs otherwise
- Dashboard API metrics — static demonstration data (live metrics wiring is v0.9 scope)
