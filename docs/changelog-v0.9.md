# Shardix v0.9.0 — Production Platform

> **Release Date**: TBD  
> **Status**: In Development

---

## 🚀 Highlights

Shardix v0.9 marks the evolution from **framework** to **production platform**. A bot with millions of users can now be developed, monitored, scaled, and operated using only the Shardix ecosystem.

---

## 📦 New Packages

### `@shardix/scheduler`
Schedule recurring tasks directly in your Discord bot using class decorators.

```ts
import { Injectable } from '@shardix/common';
import { Cron, Interval, Timeout } from '@shardix/scheduler';

@Injectable()
export class TaskService {
  // Runs every day at midnight
  @Cron('0 0 * * *')
  async cleanupExpiredSessions() {
    // ...
  }

  // Runs every 30 seconds
  @Interval(30_000)
  async syncLeaderboard() {
    // ...
  }

  // Runs once after 5 seconds on bot startup
  @Timeout(5_000)
  async announceBotReady() {
    // ...
  }
}
```

**Registration:**
```ts
import { SchedulerProvider } from '@shardix/scheduler';

const app = await ShardixFactory.create({
  providers: [new SchedulerProvider()],
  adapter: new DiscordJSAdapter(),
});
```

---

## ✨ Improved Packages

### `@shardix/provider-health` — Production Health System

Full rewrite with K8s-compatible endpoints and Prometheus metrics:

```ts
import { createHealthProvider } from '@shardix/provider-health';

const app = await ShardixFactory.create({
  providers: [
    createHealthProvider({
      server: { port: 8080 },
      description: 'My Discord Bot',
      version: '1.0.0',
    })
      .addCheck('discord_gateway', () => client.ws.ping < 500)
      .addCheck('redis', async () => {
        await redisClient.ping();
        return true;
      }),
  ],
});
```

**Endpoints:**
- `GET :8080/health` → Full RFC health check response (JSON)
- `GET :8080/ready` → Readiness probe (`{ ready: true }`)
- `GET :8080/live` → Liveness probe (`{ live: true, uptime: 3600 }`)
- `GET :8080/metrics` → Prometheus text format

**Prometheus output:**
```
# HELP shardix_health_check_up Is the check passing (1) or failing (0)
# TYPE shardix_health_check_up gauge
shardix_health_check_up{name="discord_gateway"} 1
shardix_health_check_up{name="redis"} 1
# HELP shardix_uptime_seconds Process uptime
# TYPE shardix_uptime_seconds counter
shardix_uptime_seconds 3600
# HELP shardix_memory_heap_bytes Heap memory used
# TYPE shardix_memory_heap_bytes gauge
shardix_memory_heap_bytes 52428800
```

---

### `@shardix/provider-observability` — Live Metrics System

Full rewrite with real-time metrics collection, structured logging, and tracing:

```ts
import { createObservabilityProvider } from '@shardix/provider-observability';

const app = await ShardixFactory.create({
  providers: [
    createObservabilityProvider({
      collectIntervalMs: 1000,
      prettyLogs: process.env.NODE_ENV === 'development',
      wsMetrics: { enabled: true, port: 9090 },
    }),
  ],
});
```

**Live Metrics collected:**
| Category | Metric |
|----------|--------|
| System | CPU%, Heap, RSS, Event Loop Delay, Active Handles |
| Discord | interactions/s, commands/s, events/s, gateway ping |
| Performance | avg command duration (ms), p95 duration |
| Cache | hit ratio, hits, misses |
| Errors | errors/s, total errors |

**Structured Logging:**
```ts
const logger = app.get(StructuredLogger);
const span = tracer.startSpan('handle_ping', { 'discord.user.id': userId });

logger.info('Handling /ping command', { userId, guildId }, span);

tracer.finishSpan(span.spanId);
```

**WebSocket Metrics Stream (port 9090):**
```json
{
  "type": "metrics",
  "data": {
    "timestamp": "2026-08-04T12:00:00.000Z",
    "cpuUsagePercent": 2.3,
    "memoryHeapUsedMB": 48,
    "interactionsPerSec": 142,
    "avgCommandDurationMs": 3.8,
    "gatewayPingMs": 45
  }
}
```

---

## 📋 Architecture Decision Records

Ten new ADRs guiding v0.9 implementation:

| ADR | Title |
|-----|-------|
| [0046](./adr/0046-v09-dashboard-web-architecture.md) | Dashboard Web Architecture |
| [0047](./adr/0047-v09-observability-and-telemetry.md) | Observability & Telemetry |
| [0048](./adr/0048-v09-scheduler-system.md) | Scheduler System |
| [0049](./adr/0049-v09-queue-system-enhanced.md) | Queue System Enhanced |
| [0050](./adr/0050-v09-storage-layer.md) | Storage Layer |
| [0051](./adr/0051-v09-plugin-marketplace.md) | Plugin Marketplace |
| [0052](./adr/0052-v09-production-runtime.md) | Production Runtime |
| [0053](./adr/0053-v09-opentelemetry-integration.md) | OpenTelemetry Integration |
| [0054](./adr/0054-v09-secrets-management.md) | Secrets Management |
| [0055](./adr/0055-v09-api-stability-freeze.md) | API Stability Freeze |

---

## 🗺 What's Coming in v0.9 (Roadmap)

### Phase 2 (Next)
- `@shardix/provider-queue` — Full BullMQ/Redis queue with `@QueueProcessor`
- `@shardix/provider-eventbus` — Distributed event bus (Redis/NATS)
- `@shardix/secrets` — Secrets manager with Vault/AWS support
- Configuration Center with hot-reload

### Phase 3 (Dashboard & Platform)  
- `@shardix/dashboard` — Full Next.js 15 dashboard with live charts
- `shardix deploy` — Generate Dockerfile, k8s manifests, GitHub Actions
- `@shardix/plugins` — Plugin marketplace foundation

### Phase 4 (Polish → v1.0)
- Hot Module Reload
- API Stability Freeze
- VS Code Extension
- Complete documentation overhaul

---

## Migration Guide

### From v0.8.x

No breaking changes in v0.9. All existing code continues to work.

**New recommended setup for production bots:**

```diff
 const app = await ShardixFactory.create({
   adapter: new DiscordJSAdapter(),
+  providers: [
+    createHealthProvider({ server: { port: 8080 } }),
+    createObservabilityProvider({ wsMetrics: { enabled: true, port: 9090 } }),
+    new SchedulerProvider(),
+  ],
 });
```

---

## Package Versions

| Package | v0.8.1 | v0.9.0 |
|---------|--------|--------|
| `@shardix/core` | 0.8.1 | 0.9.0 |
| `@shardix/common` | 0.8.1 | 0.9.0 |
| `@shardix/scheduler` | — | **0.9.0** (new) |
| `@shardix/provider-health` | 0.8.1 | **0.9.0** |
| `@shardix/provider-observability` | 0.8.1 | **0.9.0** |
| All adapters | 0.8.1 | 0.9.0 |
