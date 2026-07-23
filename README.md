<h1 align="center">⚡ Shardix</h1>

<p align="center">
  <b>The Enterprise-Grade Architectural Framework for Discord Applications & Bots</b>
</p>

<p align="center">
  <a href="README.pt-BR.md">Português (Brasil)</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-monorepo-packages">Packages</a> •
  <a href="#-license">License</a>
</p>

<p align="center">
  <img alt="Shardix Version" src="https://img.shields.io/badge/version-0.3.0-8b5cf6?style=for-the-badge&logo=typescript">
  <img alt="Zero Vendor Lock-in" src="https://img.shields.io/badge/Vendor--Lock--in-ZERO-22c55e?style=for-the-badge">
  <img alt="Ecosystem" src="https://img.shields.io/badge/Official%20Providers-5%20Packages-purple?style=for-the-badge">
  <img alt="Runtime System" src="https://img.shields.io/badge/Runtime-Gateway%20%7C%20HTTP%20%7C%20Hybrid-orange?style=for-the-badge">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge">
</p>

---

## 🎯 What is Shardix?

**Shardix is NOT a Discord API wrapper library** (and does not aim to replace `discord.js`, `Eris`, or `Discordeno`).

Instead, **Shardix is for Discord bots what [NestJS](https://nestjs.com/) is for Express/Fastify**:

> An enterprise architectural framework focused on productivity, maintainability, modularity, and high-performance scalability.

While Discord API libraries remain responsible for low-level socket or REST protocol interactions, **Shardix handles**:
* 🏛️ **Clean Architecture & SOLID**
* ⚡ **Abstract Transport Layer** (First-class HTTP Interactions & Gateway)
* 🔌 **Zero Vendor Lock-in** (Interchangeable Library Adapters)
* 📦 **Dependency Injection (IoC Container)** (Singleton, Scoped & Transient)
* 🎨 **Declarative Decorators** (`@Controller()`, `@SlashCommand()`, `@Button()`, `@Event()`, etc.)
* 🚀 **Infrastructure & Observability Ready** (Docker, Kubernetes, Redis, Pino Logger, Prometheus)

---

## ✨ Key Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Zero Vendor Lock-in** | Decoupled Core communicating strictly through `DiscordAdapter` interfaces | Swap `discord.js` for `Eris` or `Discordeno` without changing business code |
| **HTTP Interactions 1st Class** | Full ed25519 signature-validated Fastify HTTP server built-in | 0 WebSocket connections, serverless compatibility, 90%+ RAM reduction |
| **Native IoC Container** | Complete Dependency Injection engine with Metadata Reflection | Easy mocking, testing, and clean service separation |
| **Universal Routing** | Same handler code works transparently on Gateway or HTTP | Write once, run everywhere |
| **Distributed EventBus** | Native event bus with Redis Pub/Sub integration | Seamless horizontal scaling across multiple pods |
| **Interactive CLI** | `create-shardix` scaffolding wizard | Spin up production-ready projects in seconds |

---

## 🚀 Quick Start

### 1. Scaffold a Project with `create-shardix`

```bash
npx create-shardix
```

Follow the interactive wizard to select your preferred library adapter, transport mode, ORM, Redis, and deployment manifests.

### 2. Declarative Code Example

```typescript
import { Controller, SlashCommand, Button, Injectable, Module } from '@shardix/common';
import { ShardixFactory } from '@shardix/core';
import { HttpInteractionsTransport } from '@shardix/transport';

@Injectable()
export class PingService {
  getPongMessage() {
    return 'Pong! Powered by Shardix HTTP Interactions 🚀';
  }
}

@Controller()
export class AppController {
  constructor(private pingService: PingService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Replies with pong',
  })
  async ping() {
    return {
      type: 4,
      data: {
        content: this.pingService.getPongMessage(),
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Click Me!',
                style: 1,
                custom_id: 'btn_ping',
              },
            ],
          },
        ],
      },
    };
  }

  @Button('btn_ping')
  async onButtonClick() {
    return {
      type: 4,
      data: { content: 'Button clicked! 🎉' },
    };
  }
}

@Module({
  controllers: [AppController],
  providers: [PingService],
})
export class AppModule {}

async function bootstrap() {
  const app = await ShardixFactory.create({
    transport: new HttpInteractionsTransport({
      port: 3000,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
    }),
  });

  app.register(AppModule);
  await app.start();
  console.log('Shardix Application running on port 3000');
}

bootstrap();
```

---

## 🏗️ Architecture & Transports

Shardix abstracts the underlying channel used to receive events and interactions.

```
       +---------------------------------------------+
       |             Shardix Application             |
       +---------------------------------------------+
                              |
                   +---------------------+
                   |   Transport Layer   |
                   +---------------------+
                              |
       +----------------------+----------------------+
       |                                             |
+--------------+                             +---------------+
| Gateway WS   |                             | HTTP POST     |
| Transport    |                             | Interactions  |
+--------------+                             +---------------+
       |                                             |
+--------------+                             +---------------+
| Discord      |                             | Fastify HTTP  |
| Adapter      |                             | Server        |
+--------------+                             +---------------+
```

---

## 📦 Monorepo Packages

```
packages/
├── @shardix/common       # Interfaces, decorators, lifecycle hooks & constants
├── @shardix/core         # IoC Container, Router & ShardixFactory
├── @shardix/transport    # Gateway & HTTP Interactions transports
├── @shardix/http         # Fastify HTTP engine & ed25519 signature verification
├── @shardix/discordjs    # Official discord.js v14+ adapter
├── @shardix/logger       # Pino-inspired structured logger
├── @shardix/cache        # Memory & Redis cache engine
├── @shardix/events       # Local & Distributed EventBus (Redis Pub/Sub)
└── create-shardix        # Interactive CLI scaffolding tool
```

---

## 🧪 Testing

Shardix is built with testability as a core requirement. Unit test services and controllers easily with Vitest:

```bash
pnpm test
```

---

## 📄 License

Shardix is open-source software licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with 💜 for the Discord Developer Community
</p>
