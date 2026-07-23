# Adapters Multi-Biblioteca

O Shardix suporta todas as principais bibliotecas de Discord em TypeScript nativamente.

## Alternando Adapters

Para alterar sua biblioteca de Discord, basta modificar a instância do adapter no `ShardixFactory.create()`:

```typescript
import { DiscordJSAdapter } from '@shardix/discordjs';
import { ErisAdapter } from '@shardix/eris';
import { OceanicAdapter } from '@shardix/oceanicjs';
import { DiscordenoAdapter } from '@shardix/discordeno';

// Discord.js
const app1 = await ShardixFactory.create({ adapter: new DiscordJSAdapter() });

// Eris
const app2 = await ShardixFactory.create({ adapter: new ErisAdapter() });

// Oceanic.js
const app3 = await ShardixFactory.create({ adapter: new OceanicAdapter() });

// Discordeno
const app4 = await ShardixFactory.create({ adapter: new DiscordenoAdapter() });
```

Nenhuma alteração é necessária em seus controllers, services, guards ou interceptors!
