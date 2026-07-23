# Official Providers

Providers extend your application with infrastructure capabilities.

## Available Providers

- `@shardix/provider-config`: Environment `.env` & `shardix.config.ts` loader
- `@shardix/provider-logger`: High performance Pino structured logger
- `@shardix/provider-cache`: Unified Memory and Redis cache
- `@shardix/provider-eventbus`: Local & Distributed Pub/Sub event bus
- `@shardix/provider-health`: Kubernetes & Docker Liveness/Readiness probes
- `@shardix/provider-queue`: Background job queues (Retries & Delayed jobs)
- `@shardix/provider-observability`: OpenTelemetry & Prometheus metrics
- `@shardix/provider-dashboard`: Control Plane Dashboard integration

## Usage

```typescript
import { ConfigProvider } from '@shardix/provider-config';
import { LoggerProvider } from '@shardix/provider-logger';
import { CacheProvider } from '@shardix/provider-cache';
import { DashboardProvider } from '@shardix/provider-dashboard';

app
  .use(new ConfigProvider())
  .use(new LoggerProvider())
  .use(new CacheProvider())
  .use(new DashboardProvider({ port: 3005 }));
```
