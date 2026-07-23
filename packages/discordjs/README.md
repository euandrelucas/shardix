# @shardix/discordjs

> Official **Discord.js** Adapter for Shardix Framework.

## Installation

```bash
pnpm add @shardix/discordjs discord.js
```

## Usage

```typescript
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter({ intents: [] }),
  });
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/euandrelucas/shardix)
