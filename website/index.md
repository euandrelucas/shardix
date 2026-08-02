---
layout: home

hero:
  name: "Shardix"
  text: "Enterprise Discord Framework"
  tagline: "Build scalable, production-ready Discord bots with NestJS-inspired architecture. Zero vendor lock-in. Any library."
  image:
    src: /logo-hero.svg
    alt: Shardix Framework
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/euandrelucas/shardix
    - theme: alt
      text: Join Discord
      link: https://discord.gg/shardix

features:
  - icon: 🔌
    title: Zero Vendor Lock-in
    details: Write once, run on Discord.js, Eris, Oceanic.js, or Discordeno. Swap libraries without touching your business logic.
    link: /guide/adapters
    linkText: Learn about adapters

  - icon: 🏗️
    title: NestJS-Inspired Architecture
    details: Modular design with @Module, @Injectable, @Controller, and a full IoC container. Built for large-scale, maintainable bots.
    link: /guide/architecture
    linkText: Learn about DI

  - icon: ⚡
    title: Multi-Runtime Engine
    details: Run via Gateway WebSocket, HTTP Webhook interactions, or Hybrid mode. Deploy anywhere — VPS, serverless, Kubernetes.
    link: /guide/runtimes
    linkText: Compare runtimes

  - icon: 🧩
    title: Official Providers
    details: Config, Pino Logger, Memory/Redis Cache, EventBus, Job Queues, Health Checks, and OpenTelemetry Observability.
    link: /guide/providers
    linkText: Browse providers

  - icon: 🎛️
    title: Control Plane Dashboard
    details: Real-time telemetry, worker health monitoring, command analytics, live log streams, and REST management endpoints.
    link: /guide/dashboard
    linkText: Set up dashboard

  - icon: 🧪
    title: First-Class Testing
    details: Built-in testing utilities with MockDiscordAdapter, createTestingApplication, and mockInteraction helpers.
    link: /guide/testing
    linkText: Write tests
---

<div class="tech-compat">
  <p>Works with</p>
  <div class="tech-logos">
    <a href="https://nodejs.org" title="Node.js" target="_blank"><img src="https://nodejs.org/static/images/logo.svg" alt="Node.js" height="32"></a>
    <a href="https://bun.sh" title="Bun" target="_blank"><img src="https://bun.sh/logo.svg" alt="Bun" height="32"></a>
    <a href="https://www.typescriptlang.org" title="TypeScript" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg" alt="TypeScript" height="32"></a>
    <a href="https://discord.js.org" title="Discord.js" target="_blank"><img src="https://discord.js.org/static/logo.svg" alt="Discord.js" height="32"></a>
  </div>
</div>

## Why Shardix?

```typescript
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { Module, Controller, SlashCommand, Injectable, CommandContext, EmbedBuilder } from '@shardix/common';

@Injectable()
class WelcomeService {
  greet(username: string) {
    return `Hello, ${username}! Welcome to Shardix ⚡`;
  }
}

@Controller()
class PingController {
  constructor(private welcome: WelcomeService) {}

  @SlashCommand({ name: 'ping', description: 'Ping the bot' })
  async ping(ctx: CommandContext) {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(this.welcome.greet(ctx.user.username))
      .setColor(0x5865F2)
      .setTimestamp();

    return ctx.reply({ embeds: [embed.toJSON()] });
  }
}

@Module({ providers: [WelcomeService], controllers: [PingController] })
class AppModule {}

const app = await ShardixFactory.create({ adapter: new DiscordJSAdapter() });
app.register(AppModule);
await app.start();
```

## Community

<div class="community-links">
  <a href="https://github.com/euandrelucas/shardix" target="_blank">⭐ Star on GitHub</a> ·
  <a href="https://discord.gg/shardix" target="_blank">💬 Join Discord</a> ·
  <a href="https://www.npmjs.com/org/shardix" target="_blank">📦 View on npm</a>
</div>
