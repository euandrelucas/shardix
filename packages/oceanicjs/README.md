# @shardix/oceanicjs

> Official **Oceanic.js** Adapter for Shardix Framework.

## Installation

```bash
pnpm add @shardix/oceanicjs oceanic.js
```

## Usage

```typescript
import { ShardixFactory } from '@shardix/core';
import { OceanicAdapter } from '@shardix/oceanicjs';

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new OceanicAdapter(),
  });
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/shardix/shardix)
