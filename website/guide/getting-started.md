# Getting Started

Welcome to **Shardix Framework** — the enterprise-grade architecture framework for building scalable Discord bots. Think NestJS, but for Discord.

## Prerequisites

- Node.js **18.0.0** or newer
- A Discord application and bot token ([Create one here](https://discord.com/developers/applications))
- npm, pnpm, yarn, or bun

## Creating a New Project

The fastest way to get started is with the Shardix CLI:

```bash
npx @shardix/cli new my-bot
```

The interactive wizard will ask you:
- **Project name** — the name for your bot project
- **Discord library adapter** — Discord.js (recommended), Eris, Oceanic.js, or Discordeno
- **Transport type** — Gateway (WebSocket), HTTP Interactions, or Hybrid
- **Database ORM** — Prisma, Drizzle ORM, or None
- **Redis Cache** — for distributed caching and event bus
- **Docker setup** — generates Dockerfile and docker-compose.yml

The CLI will also ask if you want to **install dependencies automatically**.

## Manual Installation

If you prefer to set up manually:

```bash
# Install core packages
npm install @shardix/core @shardix/common @shardix/discordjs discord.js dotenv

# Install dev dependencies
npm install --save-dev typescript tsx tsup @types/node
```

## Project Structure

A Shardix project follows a modular architecture inspired by NestJS:

```
src/
├── app.module.ts          # Root module — registers all providers and controllers
├── main.ts                # Application entry point
├── register-commands.ts   # Slash command registration script
├── ping.controller.ts     # Commands, buttons, events
└── user.service.ts        # Business logic (injectable service)
```

## Step 1: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "strict": false,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

::: warning Important
`experimentalDecorators` and `emitDecoratorMetadata` **must** be `true` — Shardix uses TypeScript decorators for its DI system and routing.
:::

## Step 2: Set Up Environment Variables

Create `.env`:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
# Optional: for instant command updates during development
GUILD_ID=your_test_server_id
```

To get these values:
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application → copy the **Application ID** → that's your `CLIENT_ID`
3. Go to the **Bot** tab → Reset Token → copy it → that's your `DISCORD_TOKEN`
4. Enable **Message Content Intent**, **Server Members Intent**, and **Presence Intent** in the Bot tab
5. Invite the bot to your server using the OAuth2 URL generator

## Step 3: Create the Root Module

Create `src/app.module.ts`:

```typescript
import { Module } from '@shardix/common';
import { PingController } from './ping.controller.js';
import { UserService } from './user.service.js';

@Module({
  providers: [UserService],      // Injectable services
  controllers: [PingController], // Command/event handlers
})
export class AppModule {}
```

## Step 4: Create a Service

Create `src/user.service.ts`:

```typescript
import { Injectable } from '@shardix/common';

@Injectable()
export class UserService {
  async getWelcomeMessage(username: string): Promise<string> {
    return `Welcome, ${username}! ⚡`;
  }

  async getUserStats(userId: string) {
    // Fetch from database, cache, etc.
    return { userId, commands: 42, joined: new Date() };
  }
}
```

## Step 5: Create a Controller

Create `src/ping.controller.ts`:

```typescript
import {
  Controller,
  SlashCommand,
  Button,
  On,
  CommandContext,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from '@shardix/common';
import { UserService } from './user.service.js';

@Controller()
export class PingController {
  constructor(private readonly userService: UserService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Check bot latency and status',
  })
  async ping(ctx: CommandContext) {
    const welcome = await this.userService.getWelcomeMessage(ctx.user.username);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(welcome)
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: 'Shardix Framework' });

    const button = new ButtonBuilder()
      .setCustomId('ping_again')
      .setLabel('Ping Again!')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    return ctx.reply({
      embeds: [embed.toJSON()],
      components: [row.toJSON()],
    });
  }

  @Button('ping_again')
  async onPingAgain(ctx: CommandContext) {
    return ctx.reply({
      content: '🏓 Pong again!',
      ephemeral: true,
    });
  }

  @On('ready')
  onReady(client: any) {
    console.log(`✅ Logged in as ${client.user.tag}`);
  }
}
```

## Step 6: Create the Entry Point

Create `src/main.ts`:

```typescript
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config(); // ← Must be FIRST before any Shardix imports

import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ Missing DISCORD_TOKEN in .env!');
    process.exit(1);
  }

  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  app.register(AppModule);

  await app.start();
  console.log('🚀 Bot is running!');
}

bootstrap().catch((err) => {
  console.error('❌ Bootstrap error:', err);
  process.exit(1);
});
```

::: tip dotenv must be first
Always call `dotenv.config()` **before** importing anything from Shardix. Otherwise `process.env.DISCORD_TOKEN` will be `undefined` when the adapter is created.
:::

## Step 7: Register Slash Commands

Slash commands must be registered with Discord's API before they appear in the server. Create `src/register-commands.ts`:

```typescript
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { REST, Routes } from 'discord.js';

const commands = [
  { name: 'ping', description: 'Check bot latency and status' },
];

async function registerCommands() {
  const token = process.env.DISCORD_TOKEN!;
  const clientId = process.env.CLIENT_ID!;
  const guildId = process.env.GUILD_ID; // Optional: for instant updates

  if (!token || !clientId) {
    console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);

  console.log('📡 Registering slash commands...');

  if (guildId) {
    // Guild commands update instantly (great for development!)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ Registered ${commands.length} guild commands in ${guildId}`);
  } else {
    // Global commands take up to 1 hour to propagate
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ Registered ${commands.length} global commands`);
  }
}

registerCommands().catch(console.error);
```

Run it:

```bash
npx tsx src/register-commands.ts
# or
npm run register-commands
```

::: tip Development tip
Set `GUILD_ID` in `.env` during development — guild commands update **instantly** instead of waiting up to 1 hour for global commands.
:::

## Step 8: Run the Bot

```bash
# Development mode (hot reload)
npm run dev

# Production
npm run build && npm start
```

You should see:
```
🚀 Bot is running!
✅ Logged in as MyBot#1234
```

## Troubleshooting

### ❌ `Cannot find module 'discord.js'`
Make sure discord.js is installed: `npm install discord.js`

### ❌ `Missing DISCORD_TOKEN`
- Check `.env` exists in your project root
- Make sure `dotenv.config()` is called **first** in `main.ts`
- Verify the token is correct in Discord Developer Portal

### ❌ Slash commands not appearing
- Run `npm run register-commands`
- For development, set `GUILD_ID` for instant updates
- Check the bot has `applications.commands` scope in the invite URL

### ❌ Bot doesn't respond to commands
- Make sure the bot has **Message Content Intent** enabled in Developer Portal
- Check that commands are registered (run `register-commands` again)
- Verify the bot is online and in the server

### ❌ `experimentalDecorators` errors
- Add `"experimentalDecorators": true` and `"emitDecoratorMetadata": true` to `tsconfig.json`
- Restart TypeScript server in your IDE

## Next Steps

- [Architecture & Dependency Injection](/guide/architecture) — Learn about @Module, @Injectable, and the IoC container
- [Events & Unified Context](/guide/events) — Handle Discord events with @On and @Once
- [Universal Builders](/guide/builders) — Build embeds, buttons, modals, and more
- [Multi-Library Adapters](/guide/adapters) — Switch between Discord.js, Eris, and others
