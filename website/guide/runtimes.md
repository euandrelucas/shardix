# Runtimes (Gateway, HTTP, Hybrid, Distributed)

Shardix features a flexible multi-runtime engine designed to run applications across different execution environments without changing business logic.

---

## ⚡ 1. Gateway Runtime (`GatewayRuntime`)
Best for traditional Discord bots connecting via WebSocket Gateway.

```typescript
import { ShardixFactory, GatewayRuntime } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  runtime: new GatewayRuntime(),
});
await app.start();
```

---

## 🌐 2. HTTP Interactions Runtime (`HttpRuntime`)
Best for serverless edge deployments (Vercel, AWS Lambda, Cloudflare Workers) or high-scale HTTP webhooks. Uses Fastify and Ed25519 signature verification.

```typescript
import { ShardixFactory, HttpRuntime } from '@shardix/core';
import { FastifyHttpTransport } from '@shardix/http';

const app = await ShardixFactory.create({
  runtime: new HttpRuntime({
    transport: new FastifyHttpTransport({ port: 3000, publicKey: process.env.DISCORD_PUBLIC_KEY }),
  }),
});
await app.start();
```

---

## 🔀 3. Hybrid Runtime (`HybridRuntime`)
Best for large applications that handle WebSocket events on Gateway while handling high-throughput Slash Command callbacks via HTTP Webhooks.

```typescript
import { ShardixFactory, HybridRuntime } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { FastifyHttpTransport } from '@shardix/http';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  runtime: new HybridRuntime({
    httpTransport: new FastifyHttpTransport({ port: 3000, publicKey: process.env.DISCORD_PUBLIC_KEY }),
  }),
});
await app.start();
```

---

## 🚀 4. Distributed Runtime (`DistributedRuntime`)
Best for scaling enterprise bots across multiple worker processes or containers.

```typescript
import { ShardixFactory } from '@shardix/core';
import { DistributedRuntime } from '@shardix/runtime-distributed';

const app = await ShardixFactory.create({
  runtime: new DistributedRuntime({ workerCount: 4 }),
});
await app.start();
```
