---
title: Health Checks — /health, /ready, /live, /metrics
description: K8s-compatible health probe endpoints and Prometheus metrics for Shardix bots running in production.
---

# 🏥 Health Checks

`@shardix/provider-health` exposes production-grade health probe HTTP endpoints compatible with **Kubernetes**, **Docker Compose** health checks, and **Prometheus** monitoring — without any external HTTP framework dependency.

## Installation

```bash
npm install @shardix/provider-health
```

## Quick Setup

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { createHealthProvider } from '@shardix/provider-health';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    createHealthProvider({
      server: { port: 8080 },
      description: 'My Discord Bot',
      version: process.env.npm_package_version,
    })
      .addCheck('discord_gateway', () => client.ws.ping < 500)
      .addCheck('redis', async () => {
        await redis.ping();
        return true;
      }),
  ],
});
```

---

## HTTP Endpoints

Once the provider boots, 4 endpoints are available:

### `GET /health`

Full RFC Health Check Response ([draft-inadarei-api-health-check](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check)):

```json
{
  "status": "pass",
  "version": "1.0.0",
  "description": "My Discord Bot",
  "checks": {
    "discord_gateway": [{
      "componentName": "discord_gateway",
      "componentType": "external",
      "status": "pass",
      "durationMs": 2,
      "time": "2026-08-04T12:00:00.000Z"
    }],
    "redis": [{
      "componentName": "redis",
      "componentType": "datastore",
      "status": "pass",
      "durationMs": 1,
      "time": "2026-08-04T12:00:00.000Z"
    }],
    "memory": [{
      "componentName": "memory",
      "componentType": "system",
      "status": "pass",
      "observedValue": "48",
      "observedUnit": "MB"
    }]
  }
}
```

- `200 OK` when status is `pass` or `warn`
- `503 Service Unavailable` when status is `fail`

### `GET /ready`

Kubernetes readiness probe — is the bot ready to handle traffic?

```json
{ "ready": true }
```

Returns `503` if any **critical** check is failing.

### `GET /live`

Kubernetes liveness probe — is the process alive?

```json
{
  "live": true,
  "pid": 12345,
  "uptime": 3600
}
```

Always returns `200` while the Node.js process is running.

### `GET /metrics`

Prometheus text format for scraping:

```
# HELP shardix_health_check_up Check status (1=pass, 0=fail)
# TYPE shardix_health_check_up gauge
shardix_health_check_up{name="discord_gateway"} 1
shardix_health_check_up{name="redis"} 1
shardix_health_check_up{name="memory"} 1

# HELP shardix_uptime_seconds Process uptime in seconds
# TYPE shardix_uptime_seconds counter
shardix_uptime_seconds 3600

# HELP shardix_memory_heap_bytes Heap memory used
# TYPE shardix_memory_heap_bytes gauge
shardix_memory_heap_bytes 50331648

# HELP shardix_memory_rss_bytes RSS memory
# TYPE shardix_memory_rss_bytes gauge
shardix_memory_rss_bytes 104857600
```

---

## Registering Custom Checks

### Simple boolean check

```ts
provider.addCheck('discord_gateway', () => client.ws.ping < 500);
```

### Async check with timeout

```ts
provider.addCheck('database', async () => {
  await db.query('SELECT 1');
  return true;
}, {
  componentType: 'datastore',
  timeoutMs: 3000,  // fail if check takes > 3s
  critical: true,   // failing this = overall status 'fail'
});
```

### Detailed check with custom output

```ts
import { HealthCheckDefinition } from '@shardix/provider-health';

const redisCheck: HealthCheckDefinition = {
  name: 'redis',
  componentType: 'datastore',
  timeoutMs: 2000,
  critical: true,
  handler: async () => {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        componentName: 'redis',
        componentType: 'datastore',
        status: 'pass',
        observedValue: Date.now() - start,
        observedUnit: 'ms',
        time: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
    } catch (err) {
      return {
        componentName: 'redis',
        componentType: 'datastore',
        status: 'fail',
        output: err.message,
        time: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
    }
  },
};

healthService.register(redisCheck);
```

---

## Configuration

```ts
createHealthProvider({
  // HTTP server options
  server: {
    port: 8080,             // default: 8080
    host: '0.0.0.0',        // default: '0.0.0.0'
    path: '',               // path prefix, e.g. '/shardix'
    enabled: true,          // default: true
  },

  // Response metadata
  version: '1.0.0',
  description: 'My Discord Bot',
});
```

**Custom path prefix:**
```ts
createHealthProvider({ server: { port: 8080, path: '/shardix' } })
// Exposes: /shardix/health, /shardix/ready, /shardix/live, /shardix/metrics
```

---

## Kubernetes Integration

```yaml
# k8s deployment snippet
livenessProbe:
  httpGet:
    path: /live
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5

# Prometheus scraping
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

---

## Docker Compose Integration

```yaml
services:
  bot:
    image: my-shardix-bot
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    ports:
      - "8080:8080"
```

---

## Accessing HealthService in DI

```ts
import { HealthService } from '@shardix/provider-health';

@Injectable()
export class AdminService {
  constructor(@Inject(HealthService) private health: HealthService) {}

  async getStatus() {
    const result = await this.health.check();
    return result; // Full HealthCheckResponse
  }

  async isReady() {
    return this.health.isReady(); // boolean
  }
}
```

---

## Built-in Checks

These checks are registered automatically:

| Check | Type | Condition |
|-------|------|-----------|
| `memory` | system | Warns if heap > 512MB, fails if > 1GB |
| `uptime` | system | Always passes, exposes uptime value |
