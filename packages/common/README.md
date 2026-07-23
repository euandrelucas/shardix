# @shardix/common

> Common interfaces, metadata keys, and decorators for the **Shardix Framework**.

## Installation

```bash
pnpm add @shardix/common
```

## Features

- **Decorators**: `@Controller()`, `@SlashCommand()`, `@Injectable()`, `@Module()`, `@UseGuards()`, `@UseInterceptors()`, `@DependsOn()`
- **Contracts**: `DiscordAdapter`, `Transport`, `Runtime`, `ProviderContract`, `ExecutionContext`

## Usage

```typescript
import { Controller, SlashCommand, Injectable } from '@shardix/common';

@Injectable()
export class PingService {
  getPong() {
    return 'Pong!';
  }
}

@Controller()
export class PingController {
  constructor(private pingService: PingService) {}

  @SlashCommand({ name: 'ping', description: 'Replies with Pong!' })
  async ping() {
    return {
      type: 4,
      data: { content: this.pingService.getPong() }
    };
  }
}
```

## License

MIT © [Shardix Team](https://github.com/euandrelucas/shardix)
