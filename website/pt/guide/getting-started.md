# Primeiros Passos com o Shardix

Bem-vindo ao guia do **Shardix Framework**!

## Instalação

Crie um novo projeto Shardix usando o inicializador interativo via CLI:

```bash
npx create-shardix meu-bot
```

Ou instale os pacotes principais do Shardix manualmente em um projeto existente:

```bash
pnpm add @shardix/core @shardix/common @shardix/discordjs discord.js
```

## Seu Primeiro Bot Shardix

Crie `src/ping.controller.ts`:

```typescript
import { Controller, SlashCommand } from '@shardix/common';

@Controller()
export class PingController {
  @SlashCommand({ name: 'ping', description: 'Responde com Pong!' })
  async ping() {
    return {
      type: 4,
      data: {
        content: '🏓 Pong enviado pelo Shardix Framework!',
      },
    };
  }
}
```

Crie `src/main.ts`:

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
  console.log('🚀 Bot Shardix está online!');
}

bootstrap();
```

Execute sua aplicação:

```bash
DISCORD_TOKEN=seu_bot_token ts-node src/main.ts
```
