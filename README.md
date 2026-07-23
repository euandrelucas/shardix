# Shardix Framework

<p align="center">
  <img src="https://img.shields.io/badge/Shardix-Architecture%20Framework-8b5cf6?style=for-the-badge&logo=discord" alt="Shardix Banner" />
</p>

<p align="center">
  <b>Enterprise Architecture & Productivity Framework for Discord Applications & Bots</b><br>
  Inspired by NestJS architectural principles for Node.js & TypeScript.
</p>

<p align="center">
  <img alt="Shardix Version" src="https://img.shields.io/badge/version-0.4.0-8b5cf6?style=for-the-badge&logo=typescript">
  <img alt="Zero Vendor Lock-in" src="https://img.shields.io/badge/Vendor--Lock--in-ZERO-22c55e?style=for-the-badge">
  <img alt="Multi Lib Support" src="https://img.shields.io/badge/Adapters-Discord.js%20%7C%20Eris%20%7C%20Oceanic.js%20%7C%20Discordeno-blue?style=for-the-badge">
  <img alt="Distributed Architecture" src="https://img.shields.io/badge/Architecture-Distributed%20Workers-purple?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge">
</p>

---

## 💡 What is Shardix?

**Shardix is NOT a Discord API wrapper library.** It does not aim to replace `discord.js`, `Eris`, `Oceanic.js`, or `Discordeno`.

Instead, Shardix is to Discord bots what **NestJS** is to Express/Fastify:
> An enterprise-grade framework for software architecture, dependency injection, scalability, observability, and developer experience.

---

## 🔌 Zero Vendor Lock-in (Multi-Library Adapters)

With Shardix, your business logic (Controllers, Services, Guards, Interceptors) is **100% decoupled** from any Discord library. You can swap your Discord library at any time by changing a single line of code!

Official Adapters:
* `@shardix/discordjs`: Official adapter for Discord.js
* `@shardix/eris`: Official adapter for Eris
* `@shardix/oceanicjs`: Official adapter for Oceanic.js
* `@shardix/discordeno`: Official adapter for Discordeno

---

## ⚡ Code Example (Swapping Adapters)

```typescript
import { Controller, SlashCommand, UseGuards } from '@shardix/common';
import { ShardixFactory, AutoScanner } from '@shardix/core';

// 1. Choose ANY Discord Library Adapter
import { DiscordJSAdapter } from '@shardix/discordjs';
// import { ErisAdapter } from '@shardix/eris';
// import { OceanicAdapter } from '@shardix/oceanicjs';
// import { DiscordenoAdapter } from '@shardix/discordeno';

@Controller()
export class PingController {
  @SlashCommand({ name: 'ping', description: 'Check bot responsiveness' })
  async ping() {
    return {
      type: 4,
      data: {
        content: '🏓 Pong! Shardix is running cleanly across any Discord library!',
      },
    };
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(), // Swap with ErisAdapter, OceanicAdapter, or DiscordenoAdapter anytime!
  });

  AutoScanner.scanAndRegister(app, [PingController]);

  await app.start();
}

bootstrap();
```

---

## 🏢 Enterprise Layered Architecture

```text
                 Application
                     │
             Distributed Runtime
        ┌────────────┼────────────┐
     Worker       Worker       Worker
        │            │            │
    Transport    Transport    Transport
        │            │            │
     Adapter      Adapter      Adapter
        │            │            │
    Providers    Providers    Providers
```

---

## 🛠️ Official Ecosystem Packages

| Package | Description |
|---|---|
| `@shardix/common` | Interfaces, contracts, decorators (`@Controller`, `@SlashCommand`, `@Injectable`) |
| `@shardix/core` | IoC Container, Dependency Injection, Router, Reflection Engine |
| `@shardix/cluster` | Cluster Manager & Worker Node abstractions |
| `@shardix/ipc` | Inter-process & distributed message communication layer |
| `@shardix/runtime-distributed` | Distributed Runtime orchestrating worker nodes |
| `@shardix/provider-config` | Config API loading `shardix.config.ts` and `.env` |
| `@shardix/provider-logger` | High-performance structured logger (JSON & Pretty) |
| `@shardix/provider-cache` | Unified Memory & Redis Cache Provider |
| `@shardix/provider-eventbus` | Local & Distributed Pub/Sub Event Bus Provider |
| `@shardix/provider-health` | Liveness, Readiness, and Health probe Provider |
| `@shardix/provider-queue` | Background job queue provider (Retries & Delayed Jobs) |
| `@shardix/provider-observability` | OpenTelemetry & Prometheus observability provider |
| `@shardix/dashboard-api` | REST API for monitoring workers, health, logs & metrics |
| `@shardix/cli` | Interactive CLI code generator & production diagnostic doctor |

---

## 📄 License

MIT © [Shardix Team](LICENSE)
