# @shardix/discordeno

> Official **Discordeno** Adapter for Shardix Framework.

## Installation

```bash
pnpm add @shardix/discordeno @discordeno/bot
```

## Usage

```typescript
import { ShardixFactory } from '@shardix/core';
import { DiscordenoAdapter } from '@shardix/discordeno';

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordenoAdapter(),
  });
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/shardix/shardix)
