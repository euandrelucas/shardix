# Multi-Library Adapters

Shardix supports all major TypeScript Discord libraries out of the box.

## Swapping Adapters

To switch your Discord library, simply change the adapter parameter in `ShardixFactory.create()`:

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

No changes to your controllers, services, guards, or interceptors are required!
