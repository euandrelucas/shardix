# Multi-Library Adapters

Shardix provides 100% Zero Vendor Lock-in by decoupling business logic from underlying Discord libraries.

---

## 🔌 Supported Adapters

| Package | Adapter Class | Underlying Library | Default Gateway Intents |
| :--- | :--- | :--- | :--- |
| `@shardix/discordjs` | `DiscordJSAdapter` | `discord.js` v14+ | `Guilds`, `GuildMessages`, `MessageContent`, `GuildMembers`, `GuildVoiceStates` |
| `@shardix/eris` | `ErisAdapter` | `eris` v0.17+ | `guilds`, `guildMessages`, `guildMembers`, `guildVoiceStates`, `messageContent` |
| `@shardix/oceanicjs` | `OceanicAdapter` | `oceanic.js` v1.10+ | `GUILDS`, `GUILD_MESSAGES`, `GUILD_MEMBERS`, `GUILD_VOICE_STATES`, `MESSAGE_CONTENT` |
| `@shardix/discordeno` | `DiscordenoAdapter` | `@discordeno/bot` v19+ | `33411` (Guilds, GuildMessages, MessageContent, GuildMembers, GuildVoiceStates) |

---

## 🔄 Swapping Adapters in 1 Line of Code

To switch from `discord.js` to `Eris` or `Oceanic.js` or `Discordeno`, simply pass the corresponding adapter to `ShardixFactory.create()`:

```typescript
import { ShardixFactory, AutoScanner } from '@shardix/core';

// 1. Discord.js
import { DiscordJSAdapter } from '@shardix/discordjs';
const app = await ShardixFactory.create({ adapter: new DiscordJSAdapter() });

// 2. Eris
import { ErisAdapter } from '@shardix/eris';
const app = await ShardixFactory.create({ adapter: new ErisAdapter() });

// 3. Oceanic.js
import { OceanicAdapter } from '@shardix/oceanicjs';
const app = await ShardixFactory.create({ adapter: new OceanicAdapter() });

// 4. Discordeno
import { DiscordenoAdapter } from '@shardix/discordeno';
const app = await ShardixFactory.create({ adapter: new DiscordenoAdapter() });
```

**Zero Business Code Alteration Needed!** All controllers, commands, events, context objects, and builders work identicallly across all adapters.
