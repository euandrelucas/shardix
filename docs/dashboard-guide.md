# Shardix Dashboard & Control Plane Guide (v0.5)

The **Shardix Control Plane Dashboard** provides real-time operational visibility into your Shardix Discord applications, workers, shards, health checks, log streams, and command latency analytics.

---

## ⚡ Enabling the Dashboard

To enable the Dashboard in any Shardix application, register `DashboardProvider` via `app.use()`:

```typescript
import { ShardixFactory } from '@shardix/core';
import { DashboardProvider } from '@shardix/provider-dashboard';

async function bootstrap() {
  const app = await ShardixFactory.create();

  app.use(new DashboardProvider({
    port: 3005,
    token: 'my_custom_secure_token',
  }));

  await app.start();
  console.log('⚡ Shardix Control Plane active on http://localhost:3005');
}

bootstrap();
```

---

## 🔒 Security & Authentication

All API routes (`/api/*`) are protected by Token Authentication:
- Header: `Authorization: Bearer <token>`
- Query parameter: `?token=<token>`

Set environment variable `SHARDIX_DASHBOARD_TOKEN` in production.

---

## 📊 REST API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/application` | Application status, version, and uptime |
| `GET /api/runtime` | Active runtime (Gateway, HTTP, Hybrid, Distributed) |
| `GET /api/workers` | Worker node health, CPU, memory, and shard assignments |
| `GET /api/shards` | Active Shard IDs, ping latency, and guild counts |
| `GET /api/health` | Services health (Discord Gateway, Redis, DB, Queues) |
| `GET /api/plugins` | Registered plugins and active status |
| `GET /api/providers` | Loaded infrastructure providers |
| `GET /api/events` | Processed Discord gateway events |
| `GET /api/logs` | Structured logs stream |
| `GET /api/metrics` | Command execution analytics and average latencies |

---

## 💻 CLI Commands

```bash
# Check status of local dashboard
shardix dashboard status

# Start standalone dashboard listener
shardix dashboard start

# Display active authentication token
shardix dashboard token
```
