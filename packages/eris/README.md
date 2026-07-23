# @shardix/eris

> Official **Eris** Adapter for Shardix Framework.

## Installation

```bash
pnpm add @shardix/eris eris
```

## Usage

```typescript
import { ShardixFactory } from '@shardix/core';
import { ErisAdapter } from '@shardix/eris';

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new ErisAdapter(),
  });
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/shardix/shardix)
