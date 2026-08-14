---
title: Observability & Live Metrics
description: Real-time system metrics, structured logging, request tracing, and WebSocket metrics streaming for production Shardix bots.
---

# 📊 Observability & Live Metrics

`@shardix/provider-observability` provides a complete real-time observability stack for production Discord bots: system metrics collection, per-second rate counters, request tracing with correlation IDs, structured JSON logging, and optional WebSocket streaming for live dashboards.

## Installation

```bash
npm install @shardix/provider-observability
```

## Quick Setup

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { createObservabilityProvider } from '@shardix/provider-observability';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    createObservabilityProvider({
      collectIntervalMs: 1000,
      logLevel: 'info',
      prettyLogs: process.env.NODE_ENV === 'development',
      wsMetrics: {
        enabled: true,
        port: 9090,
      },
    }),
  ],
});
```

---

## Live Metrics

All metrics are collected automatically every `collectIntervalMs` (default: 1000ms).

### System Metrics

| Metric | Description |
|--------|-------------|
| `cpuUsagePercent` | Real CPU utilization % (delta between samples) |
| `memoryHeapUsedMB` | V8 heap used in MB |
| `memoryHeapTotalMB` | V8 heap total in MB |
| `memoryRssMB` | Resident Set Size in MB |
| `memoryExternalMB` | External (Buffer/native) memory in MB |
| `eventLoopDelayMs` | Event loop lag in ms (via `monitorEventLoopDelay`) |
| `activeHandles` | Active libuv handles |
| `activeRequests` | Active libuv requests |
| `uptimeSeconds` | Process uptime in seconds |

### Discord / Framework Metrics

| Metric | Description |
|--------|-------------|
| `interactionsPerSec` | Interactions handled per second (1s sliding window) |
| `commandsPerSec` | Commands executed per second |
| `eventsPerSec` | Gateway events processed per second |
| `errorsPerSec` | Errors per second |
| `avgCommandDurationMs` | Rolling average command execution time |
| `p95CommandDurationMs` | Approximate p95 over last 1,000 commands |
| `gatewayPingMs` | Last known gateway WebSocket ping |
| `cacheHitRatio` | Cache hit ratio (0.0–1.0) |

---

## Accessing Metrics Programmatically

```ts
import { MetricsCollector, MetricsRecorder } from '@shardix/provider-observability';

@Injectable()
export class StatusService {
  constructor(
    @Inject(MetricsCollector) private collector: MetricsCollector,
    @Inject(MetricsRecorder) private recorder: MetricsRecorder,
  ) {}

  getSnapshot() {
    return this.collector.getCurrentMetrics();
    // Returns the full LiveMetrics object
  }
}
```

### Recording Custom Events

```ts
// Record a command execution
recorder.recordCommand('ping', durationMs);

// Record a gateway event
recorder.recordEvent('MESSAGE_CREATE');

// Record a cache hit/miss
recorder.recordCacheHit();
recorder.recordCacheMiss();

// Update gateway status
recorder.updateGatewayPing(client.ws.ping);
recorder.updateGatewayStatus('connected');

// Record an error
recorder.recordError(new Error('Something failed'), 'PingCommand');
```

---

## Structured Logging

```ts
import { StructuredLogger } from '@shardix/provider-observability';

@Injectable()
export class CommandService {
  constructor(
    @Inject(StructuredLogger) private logger: StructuredLogger,
  ) {}

  async handlePing(ctx: CommandContext) {
    this.logger.info('Handling /ping', {
      userId: ctx.userId,
      guildId: ctx.guildId,
    });

    try {
      await ctx.reply({ content: 'Pong!' });
      this.logger.debug('Reply sent successfully');
    } catch (err) {
      this.logger.error('Failed to reply', err, { commandName: 'ping' });
    }
  }
}
```

**JSON output** (production):
```json
{"timestamp":"2026-08-04T12:00:00.000Z","level":"info","message":"Handling /ping","userId":"12345","guildId":"67890"}
{"timestamp":"2026-08-04T12:00:00.001Z","level":"debug","message":"Reply sent successfully"}
```

**Pretty output** (development, `prettyLogs: true`):
```
[12:00:00] INFO  Handling /ping { userId: '12345', guildId: '67890' }
[12:00:00] DEBUG Reply sent successfully
```

### Child Loggers

```ts
// Create a logger with default attributes
const commandLogger = this.logger.child({ component: 'PingCommand' });
commandLogger.info('Start'); // automatically includes component field
```

---

## Request Tracing

```ts
import { Tracer } from '@shardix/provider-observability';

@Injectable()
export class TracedCommandService {
  constructor(@Inject(Tracer) private tracer: Tracer) {}

  async handleHeavy(ctx: CommandContext) {
    // Start a span
    const span = this.tracer.startSpan('handle_heavy', {
      'discord.command': 'heavy',
      'discord.user.id': ctx.userId,
      'discord.guild.id': ctx.guildId,
    });

    try {
      await this.doWork();
      this.tracer.finishSpan(span.spanId);
    } catch (err) {
      this.tracer.finishSpan(span.spanId, err);
    }
  }

  // Get all active spans
  getActiveTraces() {
    return this.tracer.getActiveSpans();
  }

  // Get recent completed spans
  getHistory() {
    return this.tracer.getCompletedSpans(50); // last 50
  }
}
```

Each `TraceSpan` contains:
```ts
{
  spanId: 'uuid-v4',
  traceId: 'uuid-v4',
  correlationId: 'optional-external-id',
  operationName: 'handle_heavy',
  startTime: 1722772800000,
  duration: 12.4, // ms, set when finished
  status: 'completed',
  attributes: {
    'discord.command': 'heavy',
    'discord.user.id': '12345',
  }
}
```

---

## WebSocket Metrics Stream

When `wsMetrics.enabled = true`, a WebSocket server runs on the configured port. Any client can connect to receive live metric updates every second:

```js
// Client-side (dashboard, monitoring tool, etc.)
const ws = new WebSocket('ws://localhost:9090');

ws.on('message', (raw) => {
  const { type, data } = JSON.parse(raw);
  if (type === 'metrics') {
    console.log('CPU:', data.cpuUsagePercent + '%');
    console.log('Interactions/s:', data.interactionsPerSec);
    console.log('p95 latency:', data.p95CommandDurationMs + 'ms');
  }
});
```

This WebSocket server is what powers the **Shardix Dashboard** live charts in v0.9.

> [!NOTE]
> The WebSocket server requires the `ws` package: `npm install ws`. If not installed, the server silently degrades (no error, no metrics push — all other functionality continues normally).

---

## Configuration Reference

```ts
createObservabilityProvider({
  /** How often to collect system metrics (ms). Default: 1000 */
  collectIntervalMs: 1000,

  /** Minimum log level to output. Default: 'info' */
  logLevel: 'info',

  /** Human-readable colorized logs. Default: false (JSON) */
  prettyLogs: false,

  /** WebSocket metrics push server */
  wsMetrics: {
    enabled: false,
    port: 9090,
  },
});
```
