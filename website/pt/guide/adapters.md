# Adapters Multi-Biblioteca

O Shardix oferece **Zero Vendor Lock-in** total desacoplando sua regra de negócio das bibliotecas externas do Discord.

---

## 🔌 Adaptadores Suportados

| Pacote | Classe do Adapter | Biblioteca Nativa | Intents de Gateway Padrão |
| :--- | :--- | :--- | :--- |
| `@shardix/discordjs` | `DiscordJSAdapter` | `discord.js` v14+ | `Guilds`, `GuildMessages`, `MessageContent`, `GuildMembers`, `GuildVoiceStates` |
| `@shardix/eris` | `ErisAdapter` | `eris` v0.17+ | `guilds`, `guildMessages`, `guildMembers`, `guildVoiceStates`, `messageContent` |
| `@shardix/oceanicjs` | `OceanicAdapter` | `oceanic.js` v1.10+ | `GUILDS`, `GUILD_MESSAGES`, `GUILD_MEMBERS`, `GUILD_VOICE_STATES`, `MESSAGE_CONTENT` |
| `@shardix/discordeno` | `DiscordenoAdapter` | `@discordeno/bot` v19+ | `33411` (Guilds, GuildMessages, MessageContent, GuildMembers, GuildVoiceStates) |

---

## 🔄 Alternando Adaptadores em 1 Linha de Código

Para mudar a biblioteca do seu bot de `discord.js` para `Eris`, `Oceanic.js` ou `Discordeno`, basta alterar o argumento do adaptador no `ShardixFactory.create()`:

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

**Nenhuma linha de regra de negócio precisa ser alterada!** Todos os seus controllers, eventos, comandos slash, coletores e builders funcionam identicamente sob qualquer adaptador.
