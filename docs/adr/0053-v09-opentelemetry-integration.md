# ADR-0053: OpenTelemetry Distributed Tracing Integration

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, opentelemetry, tracing, otlp, observability

## Context

As enterprise Discord application architectures shift from single process deployments to distributed microservices, multi-worker clusters, and decoupled HTTP interaction endpoints, tracing request lifecycles across process boundaries becomes vital. Standard logging and isolated metric counters are insufficient to pinpoint latency bottlenecks across complex command execution pipelines, IPC worker hops, and external database calls.

Shardix v0.9 introduces native OpenTelemetry (OTel) distributed tracing instrumentation into `@shardix/core` and `@shardix/provider-observability`, establishing unified distributed trace propagation across the entire framework lifecycle.

## Decision

We will integrate OpenTelemetry instrumentation into Shardix core components with zero mandatory external package lock-in.

Key Design Principles:
1. **Auto-Instrumentation**: Automatically creates tracing spans for every command execution, interaction handler, event listener, and provider lifecycle hook (`onModuleInit`, `boot`).
2. **Standardized Semantic Attributes**: Standardized span attributes:
   - `discord.command.name`: Name of executed slash/context-menu command.
   - `discord.user.id`: Discord snowflake ID of executing user.
   - `discord.guild.id`: Target guild snowflake ID (or `dm`).
   - `shardix.adapter`: Active transport adapter (`@shardix/discordjs`, `@shardix/transport`, etc.).
3. **Baggage & Trace Context Propagation**: Propagates trace correlation context across worker IPC messages, Redis event buses, and asynchronous queue jobs.
4. **Multiple Exporters**: Supports OTLP/HTTP (default), Jaeger (via OTLP), Prometheus pull exporter, and Grafana Cloud endpoints.
5. **Zero-Dependency Fallback (Graceful No-Op)**: OpenTelemetry npm packages (`@opentelemetry/api`, `@opentelemetry/sdk-trace-base`) are defined as optional peer dependencies. If not installed, Shardix silently defaults to high-performance no-op span wrappers with zero performance penalty.
6. **Environment Variable Configuration**: Fully configurable via standard OTel environment variables (`OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_TRACES_SAMPLER`).

## Architecture

```
 +-----------------------------------------------------------------+
 |                    Shardix Command / Event Context              |
 +--------------------------------+--------------------------------+
                                  |
                                  v
 +-----------------------------------------------------------------+
 |                    Shardix Tracing Abstraction                  |
 |  (Checks if @opentelemetry/api is installed; fallback NoOp)    |
 +--------------------------------+--------------------------------+
                                  |
           +----------------------+----------------------+
           | (If Installed)                              | (If Missing)
           v                                             v
 +----------------------------------+          +-------------------+
 |   OpenTelemetry SDK Tracer       |          |   NoOp Tracer     |
 |   - Creates Spans & Attributes   |          |   (Zero Overhead) |
 |   - Injects Baggage Context      |          +-------------------+
 +----------------+-----------------+
                  |
        +---------+---------+-------------------+
        |                   |                   |
        v                   v                   v
 +---------------+   +---------------+   +---------------+
 |  OTLP/HTTP    |   |  Jaeger OTLP  |   | Grafana Cloud |
 | (Collector)   |   |   Collector   |   |   Tracing     |
 +---------------+   +---------------+   +---------------+
```

### Code Example: Auto-Instrumented Command Execution

```typescript
import { Tracer, Span, SpanKind, StatusCode } from '@shardix/core';

export async function executeCommandSpan<T>(
  commandName: string,
  userId: string,
  guildId: string,
  handlerFn: () => Promise<T>
): Promise<T> {
  const tracer = Tracer.getTracer('shardix-core');
  
  return tracer.startActiveSpan(
    `command:${commandName}`,
    {
      kind: SpanKind.SERVER,
      attributes: {
        'discord.command.name': commandName,
        'discord.user.id': userId,
        'discord.guild.id': guildId,
        'shardix.adapter': 'discordjs',
      },
    },
    async (span: Span) => {
      try {
        const result = await handlerFn();
        span.setStatus({ code: StatusCode.OK });
        return result;
      } catch (error: any) {
        span.setStatus({ code: StatusCode.ERROR, message: error.message });
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}
```

## Consequences

### Positive
- Full end-to-end trace visibility across distributed Shardix clusters and external cloud collectors (Jaeger, Grafana Tempo).
- Standardized Discord semantic attributes simplify diagnostic querying in monitoring dashboards.
- Dynamic fallback prevents bloat or crash for users who do not require distributed tracing.

### Negative / Trade-offs
- Setting up collectors (OTLP / Jaeger) requires additional cloud or local infrastructure.
- High trace sampling rates (100% sampling) can add minor network overhead on high-volume bots.

## Implementation Notes

- Configured in `@shardix/provider-observability` or via core bootstrap settings.
- Standard OTel environment variable compliance:
  - `OTEL_SERVICE_NAME=shardix-bot`
  - `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`
  - `OTEL_TRACES_SAMPLER=parentbased_always_on`

## References
- [ADR-0019: Observability](0019-observability.md)
- [ADR-0047: Observability and Telemetry Rewrite](0047-v09-observability-and-telemetry.md)
