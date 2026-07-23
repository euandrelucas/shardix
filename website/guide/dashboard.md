# Control Plane Dashboard

The official **Shardix Control Plane Dashboard** provides real-time telemetry, worker health, command execution analytics, live log streams, and secure REST endpoints for managing production Shardix applications.

---

## 🚀 Enabling the Dashboard

Register `DashboardProvider` in your application:

```typescript
import { ShardixFactory } from '@shardix/core';
import { DashboardProvider } from '@shardix/provider-dashboard';

async function bootstrap() {
  const app = await ShardixFactory.create();

  // Register Control Plane Dashboard on port 3005
  app.use(new DashboardProvider({
    port: 3005,
    token: process.env.SHARDIX_DASHBOARD_TOKEN || 'secret_admin_token',
  }));

  await app.start();
  console.log('🎛️ Control Plane Dashboard running at http://localhost:3005');
}

bootstrap();
```

---

## 🔒 Security Model

- **Token Authentication**: All REST API endpoints require `Authorization: Bearer <token>`.
- **CORS & Rate Limiting**: Built-in security hooks to protect dashboard endpoints in production.

---

## 📡 REST API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/application` | `GET` | Application metadata, version, uptime |
| `/api/runtime` | `GET` | Active runtime state & transport details |
| `/api/workers` | `GET` | Cluster worker states and memory usage |
| `/api/shards` | `GET` | Shard allocations and Gateway latency |
| `/api/health` | `GET` | Liveness & readiness probes |
| `/api/metrics` | `GET` | OpenTelemetry & command throughput metrics |
| `/api/events` | `GET` | Live event stream audit log |
| `/api/logs` | `GET` | Real-time Pino log stream |

---

## 🛠️ CLI Dashboard Commands

```bash
# Start standalone dashboard
shardix dashboard start --port 3005

# Check dashboard status
shardix dashboard status

# View current access token
shardix dashboard token
```
