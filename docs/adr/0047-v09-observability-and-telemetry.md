# ADR-0047: Observability and Telemetry Rewrite for `@shardix/provider-observability`

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, observability, telemetry, metrics, prometheus, logger

## Context

In high-throughput Discord applications, production issues such as event loop blockages, gateway rate limits, unhandled command failures, and high interaction latency can severely degrade user experience. The previous observability module provided basic metric logging but lacked structured sampling, sliding-window rate calculation, high-precision event loop tracking, and standard metric export protocols like Prometheus.

To ensure production-grade diagnostic capabilities and seamless integration with external monitoring systems (Grafana, Prometheus, Datadog) as well as the Shardix Dashboard, `@shardix/provider-observability` undergoes a complete architecture rewrite in v0.9.

## Decision

We will replace the existing telemetry logic with a multi-collector runtime engine featuring structured JSON logging, sliding-window rate aggregation, Prometheus exposition, and optional real-time WebSocket streaming.

Core Architecture Components:
1. **SystemMetricsCollector**: Measures process-level performance using standard Node.js APIs (`process.cpuUsage()`, `process.memoryUsage()`) and `node:perf_hooks` (`monitorEventLoopDelay`).
2. **DiscordMetricsCollector**: Tracks Discord-specific metrics including REST requests per second, gateway incoming events per second, slash interaction handler throughput, and gateway ping latency.
3. **MetricsAggregator**: Computes rates, percentiles, and moving averages over configurable sliding time windows (e.g., 60-second window).
4. **StructuredLogger**: Produces structured JSON logs enriched with trace IDs, correlation IDs, timestamps, and severity levels.
5. **Prometheus Exposition**: Formats collected metrics according to OpenMetrics / Prometheus text standard exposed at `/metrics`.
6. **Real-time WebSocket Push**: Optional WebSocket server within the provider to push metric snapshots to subscribed dashboard clients every second.

## Architecture

```
 +-----------------------------------------------------------------+
 |                   Shardix Core Application                      |
 +------------------+-----------------------+----------------------+
                    |                       |
                    v                       v
      +---------------------------+ +---------------------------+
      |  SystemMetricsCollector   | |   DiscordMetricsCollector |
      | (CPU, Memory, Event Loop) | | (REST, Gateway, Ping, ...)|
      +-------------+-------------+ +-------------+-------------+
                    |                             |
                    +--------------+--------------+
                                   |
                                   v
                    +---------------------------+
                    |     MetricsAggregator     |
                    |  (Sliding Window Engine)  |
                    +--------------+------------+
                                   |
           +-----------------------+-----------------------+
           |                       |                       |
           v                       v                       v
 +-------------------+   +-------------------+   +-------------------+
 | StructuredLogger  |   | Prometheus /metrics|  |  WebSocket Stream |
 |   (JSON Format)   |   |   Text Format     |   |   (Dashboard Push)|
 +-------------------+   +-------------------+   +-------------------+
```

### Code Example: Metric Collector & Event Loop Monitor

```typescript
import { monitorEventLoopDelay, IntervalHistogram } from 'node:perf_hooks';
import { ProviderContract } from '@shardix/common';

export class SystemMetricsCollector {
  private histogram: IntervalHistogram;

  constructor() {
    this.histogram = monitorEventLoopDelay({ resolution: 20 });
    this.histogram.enable();
  }

  public getMetrics() {
    const mem = process.memoryUsage();
    return {
      cpuPercent: process.cpuUsage(),
      heapUsedBytes: mem.heapUsed,
      heapTotalBytes: mem.heapTotal,
      rssBytes: mem.rss,
      eventLoopDelayMeanMs: this.histogram.mean / 1e6,
      eventLoopDelayP95Ms: this.histogram.percentile(95) / 1e6,
      eventLoopDelayP99Ms: this.histogram.percentile(99) / 1e6,
    };
  }

  public reset() {
    this.histogram.reset();
  }
}
```

### Prometheus Exposition Format Output

```text
# HELP shardix_discord_rest_requests_total Total REST requests sent to Discord API
# TYPE shardix_discord_rest_requests_total counter
shardix_discord_rest_requests_total{status="200",method="POST"} 1420
shardix_discord_rest_requests_total{status="429",method="POST"} 3

# HELP shardix_event_loop_delay_seconds Event loop delay histogram in seconds
# TYPE shardix_event_loop_delay_seconds gauge
shardix_event_loop_delay_seconds{quantile="0.95"} 0.0042
shardix_event_loop_delay_seconds{quantile="0.99"} 0.0125
```

## Consequences

### Positive
- Sub-millisecond tracking of event loop delay accurately identifies synchronous code bottlenecks.
- Out-of-the-box Prometheus format compatibility allows zero-config integration with Grafana.
- Standardized JSON logs enable seamless log parsing in ELK / Loki pipelines.
- Direct WebSocket push minimizes overhead when powering real-time web dashboards.

### Negative / Trade-offs
- Active event loop tracking (`monitorEventLoopDelay`) introduces a minor overhead (< 0.1% CPU).
- Memory overhead for maintaining sliding window data buffers in high-throughput applications.

## Implementation Notes

- Registered via `ObservabilityProvider` implementing `ProviderContract`.
- Automatic HTTP endpoint handler attachment for `/metrics` when configured.
- Graceful shutdown releases perf_hooks timers and closes open WebSocket connections.

## References
- [ADR-0019: Observability](0019-observability.md)
- [ADR-0046: Next.js 15 Web Dashboard Architecture](0046-v09-dashboard-web-architecture.md)
- [ADR-0053: OpenTelemetry Integration](0053-v09-opentelemetry-integration.md)
