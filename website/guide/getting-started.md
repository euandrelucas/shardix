# Getting Started with Shardix

Welcome to the **Shardix Framework** guide!

## Installation

Create a new Shardix project using the interactive CLI initializer:

```bash
npx create-shardix my-bot
```

Or install Shardix core packages manually in an existing project:

```bash
pnpm add @shardix/core @shardix/common @shardix/discordjs discord.js
```

## Your First Shardix Bot

Create `src/ping.controller.ts`:

```typescript
import { Controller, SlashCommand } from '@shardix/common';

@Controller()
export class PingController {
  @SlashCommand({ name: 'ping', description: 'Replies with Pong!' })
  async ping() {
    return {
      type: 4,
      data: {
        content: '🏓 Pong from Shardix Framework!',
      },
    };
  }
}
```

Create `src/main.ts`:

```typescript
import { ShardixFactory, AutoScanner } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { PingController } from './ping.controller';

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  AutoScanner.scanAndRegister(app, [PingController]);

  await app.start();
  console.log('🚀 Shardix Bot is online!');
}

bootstrap();
```

Run your application:

```bash
DISCORD_TOKEN=your_bot_token ts-node src/main.ts
```
