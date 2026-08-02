# Shardix v0.8.1 — Compatibility Report

## Runtime Compatibility

| Runtime | Version | Status | Notes |
|---------|---------|--------|-------|
| Node.js | >= 18.x | ✅ Supported | Primary runtime |
| Node.js | >= 20.x | ✅ Supported | Recommended |
| Node.js | >= 22.x | ✅ Supported | Latest LTS |
| Bun | >= 1.0 | ✅ Supported | Fast startup |
| Bun | >= 1.1 | ✅ Recommended | Best performance |
| Deno | any | ⚠️ Untested | Not officially supported |

## Adapter Compatibility

| Adapter | Package | Status | Library Version | Notes |
|---------|---------|--------|----------------|-------|
| Discord.js | `@shardix/discordjs` | ✅ Stable | discord.js ^14.17 | Full feature support |
| Eris | `@shardix/eris` | ⚠️ Experimental | eris ^0.17 | Basic interactions only |
| Oceanic.js | `@shardix/oceanicjs` | ⚠️ Experimental | oceanic.js ^1.10 | Basic interactions only |
| Discordeno | `@shardix/discordeno` | ⚠️ Experimental | @discordeno/bot ^19 | Basic interactions only |

## Feature Compatibility Matrix

| Feature | DiscordJS | Eris | Oceanic | Discordeno |
|---------|-----------|------|---------|------------|
| Slash Commands | ✅ | ✅ | ✅ | ✅ |
| Button Components | ✅ | ✅ | ✅ | ✅ |
| Select Menus | ✅ | ✅ | ✅ | ✅ |
| Modals | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Embed Replies | ✅ | ✅ | ✅ | ✅ |
| Ephemeral Replies | ✅ | ✅ | ✅ | ✅ |
| Deferred Replies | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Context Menus | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Autocomplete | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Voice | 🚧 v0.9 | ❌ | ❌ | ❌ |
| Command Registration | ✅ native | ✅ via REST | ✅ via REST | ✅ via REST |
| `awaitButton()` | ✅ | ❌ | ❌ | ❌ |
| `awaitModal()` | ✅ | ❌ | ❌ | ❌ |
| `awaitSelect()` | ✅ | ❌ | ❌ | ❌ |
| `showModal()` | ✅ | ❌ | ❌ | ❌ |

> **Legend**: ✅ Fully supported | ⚠️ Partial support | ❌ Not supported | 🚧 Planned

## Transport Compatibility

| Transport | Package | Status | Notes |
|-----------|---------|--------|-------|
| Gateway | `@shardix/transport` | ✅ Stable | WebSocket real-time |
| HTTP Interactions | `@shardix/http` | ✅ Stable | Serverless-ready |
| Hybrid | Built into `@shardix/core` | ✅ Stable | Gateway + HTTP |
| Distributed | `@shardix/runtime-distributed` | ⚠️ Experimental | Multi-process |
