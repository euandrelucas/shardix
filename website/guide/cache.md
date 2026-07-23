# Cache Layer, Storage Providers & Synchronization

Shardix features an enterprise multi-tier caching system (`ShardixCacheManager`) integrated automatically with Gateway events and external providers.

---

## ⚡ How Shardix Caching Works

1. **Automatic Gateway Synchronization**: As events arrive (`GUILD_CREATE`, `MEMBER_UPDATE`, `ROLE_DELETE`), `app.cache` updates entities in real-time.
2. **Multi-Store Support**: Memory (LRU/TTL) or Redis clusters.
3. **Lazy Loading**: If an entity is missing in cache, Shardix can fetch it from Discord REST API and populate cache transparently.

---

## 🛠️ Usage Example

```typescript
import { ShardixFactory } from '@shardix/core';
import { MemoryCacheProvider, RedisCacheProvider } from '@shardix/provider-cache';

const app = await ShardixFactory.create();

// Register Redis Cache Provider
app.useProvider(new RedisCacheProvider('redis://localhost:6379'));

// Access cached entities directly
const guild = await app.cache.guild('123456789');
const member = await app.cache.member('123456789', '987654321');
```

---

## 📊 Supported Cache Entities

- `app.cache.guild(id)`
- `app.cache.channel(id)`
- `app.cache.user(id)`
- `app.cache.member(guildId, userId)`
- `app.cache.role(guildId, roleId)`
- `app.cache.emoji(guildId, emojiId)`
- `app.cache.sticker(guildId, stickerId)`
- `app.cache.thread(guildId, threadId)`
- `app.cache.voiceState(guildId, userId)`
