# @shardix/core

> Core architectural engine, IoC container, reflection system, and application factory for **Shardix Framework**.

## Installation

```bash
pnpm add @shardix/core @shardix/common
```

## Features

- **IoC Container**: Constructor dependency injection with circular dependency protection.
- **Reflection Engine**: WeakMap metadata caching for ultra-fast metadata resolution.
- **AutoScanner**: Zero-configuration discovery of modules, controllers, and services.
- **ProjectAnalyzer**: Transport & Runtime recommendation engine.

## Usage

```typescript
import { ShardixFactory, AutoScanner } from '@shardix/core';
import { PingController } from './ping.controller';

async function bootstrap() {
  const app = await ShardixFactory.create();
  AutoScanner.scanAndRegister(app, [PingController]);
  await app.start();
}

bootstrap();
```

## License

MIT © [Shardix Team](https://github.com/euandrelucas/shardix)
