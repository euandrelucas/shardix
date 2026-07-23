# @shardix/provider-dashboard

> Official Control Plane Dashboard Provider for **Shardix Framework**.

## Installation

```bash
pnpm add @shardix/provider-dashboard @shardix/dashboard-api
```

## Usage

```typescript
import { ShardixFactory } from '@shardix/core';
import { DashboardProvider } from '@shardix/provider-dashboard';

async function bootstrap() {
  const app = await ShardixFactory.create();
  app.use(new DashboardProvider({ port: 3005 }));
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/shardix/shardix)
