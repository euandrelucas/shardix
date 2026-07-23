# Runtimes (Gateway, HTTP, Híbrido, Distribuído)

O Shardix possui um motor multi-runtime flexível projetado para executar aplicações em diferentes ambientes sem alterar a regra de negócio.

---

## ⚡ 1. Gateway Runtime (`GatewayRuntime`)
Ideal para bots de Discord tradicionais que conectam via WebSocket Gateway.

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
Ideal para implantações serverless edge (Vercel, AWS Lambda, Cloudflare Workers) ou webhooks HTTP de alta escala. Utiliza Fastify e verificação de assinatura Ed25519.

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

## 🔀 3. Runtime Híbrido (`HybridRuntime`)
Ideal para grandes aplicações que processam eventos de servidor via WebSocket Gateway enquanto respondem a comandos Slash de alta frequência via Webhooks HTTP.

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

## 🚀 4. Runtime Distribuído (`DistributedRuntime`)
Ideal para escalar bots corporativos em múltiplos processos ou containers.

```typescript
import { ShardixFactory } from '@shardix/core';
import { DistributedRuntime } from '@shardix/runtime-distributed';

const app = await ShardixFactory.create({
  runtime: new DistributedRuntime({ workerCount: 4 }),
});
await app.start();
```
