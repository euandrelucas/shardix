# @shardix/runtime-distributed

> Distributed Runtime orchestrating worker nodes and cluster communication for **Shardix Framework**.

## Installation

```bash
pnpm add @shardix/runtime-distributed
```

## Usage

```typescript
import { ShardixFactory } from '@shardix/core';
import { DistributedRuntime } from '@shardix/runtime-distributed';

async function bootstrap() {
  const app = await ShardixFactory.create({
    runtime: new DistributedRuntime({ workerCount: 4 }),
  });
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/shardix/shardix)
