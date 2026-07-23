# Shardix Framework — Complete Class Index & API Reference

Comprehensive class reference for all packages in the Shardix monorepo.

---

## 🟢 `@shardix/core`

### `ShardixApplication`
The central application container orchestrating dependency injection, runtimes, adapters, rest client, cache, and presence.
- **`rest`**: `ShardixRestClient` instance for REST API calls.
- **`cache`**: `ShardixCacheManager` instance for entity caching.
- **`presence`**: `PresenceManager` instance for status updates.
- **`start()`**: `Promise<void>` — Initializes providers, registers modules, connects runtime & adapter.
- **`stop(signal?: string)`**: `Promise<void>` — Gracefully stops application and transports.

### `ShardixFactory`
Factory helper to instantiate `ShardixApplication`.
- **`ShardixFactory.create(options?: ShardixOptions)`**: `Promise<ShardixApplication>`

### `InteractionRouter`
Internal router matching incoming interactions (slash commands, buttons, modals, select menus) to decorated controller methods.

### `PresenceManager`
- **`set(options: PresenceOptions)`**: `void` — Sets status (`online`, `idle`, `dnd`, `invisible`) and activities.
- **`getPresence()`**: `PresenceOptions`

### `RateLimitManager`
- **`check(bucketKey: string, limit?: number, windowMs?: number)`**: `{ allowed: boolean; retryAfter: number }`

### `MiddlewarePipeline`
- **`use(middleware: MiddlewareFunction)`**: `this`
- **`execute(req: any, res: any, finalHandler: () => Promise<any>)`**: `Promise<any>`

---

## 🔵 `@shardix/common`

### Context & Logic
- **`CommandContext`**: Unified interaction context object (`reply()`, `defer()`, `editReply()`, `followUp()`, `awaitButton()`, `awaitModal()`, `awaitSelect()`).

### Universal Builders
- **`EmbedBuilder`**: Fluent embed builder.
- **`ButtonBuilder`**: Fluent button component builder.
- **`SelectMenuBuilder`**: Fluent select menu component builder.
- **`ModalBuilder`**: Fluent modal dialog builder.
- **`PollBuilder`**: Fluent poll builder.
- **`MessageBuilder`**: Universal message payload builder.
- **`ActionRowBuilder`**: Action row layout container builder.
- **`SlashCommandBuilder`**: Slash command builder.
- **`ContextMenuBuilder`**: Context menu command builder.
- **`ThreadBuilder`**: Thread creation builder.
- **`RoleBuilder`**: Role configuration builder.
- **`AttachmentBuilder`**: Attachment builder.
- **`PermissionBuilder`**: Bitfield permission builder.

---

## 🟣 `@shardix/plugin` & `@shardix/testing`

### `@shardix/plugin`
- **`PluginManager`**: Register and manage plugin lifecycles.
- **`ShardixPlugin`**: Interface contract for third-party plugins.

### `@shardix/testing`
- **`createTestingApplication()`**: Instantiate isolated mock environment.
- **`MockDiscordAdapter`**: Zero-network mock adapter.
- **`mockInteraction()`**: Generate mock interaction payloads.

---

## 🟡 `@shardix/cache` & `@shardix/provider-cache`

- **`ShardixCacheManager`**: Unified cache manager for Guilds, Channels, Members, Users, Roles, Emojis, Stickers, Threads, and Voice States.
- **`MemoryCacheProvider`**: In-memory cache provider with TTL and sweeper support.
- **`LRUCacheProvider`**: Least Recently Used cache eviction provider.
- **`RedisCacheProvider`**: Distributed Redis cache provider.
