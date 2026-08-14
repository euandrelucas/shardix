# ADR-0046: Next.js 15 Web Dashboard Architecture for Shardix v0.9

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, dashboard, nextjs, react19, web, UI

## Context

In previous releases, the Shardix dashboard relied on lightweight, server-side rendered HTML templates and raw WebSocket scripts embedded directly within the `@shardix/dashboard-api` HTTP server. As Shardix applications grow to support large-scale enterprise Discord operations with multi-process clusters and high-throughput gateways, administrators require a feature-rich, low-latency control interface.

The existing monolithic monitoring UI lacks modern component composition, reactive client-side state management, responsive metrics visualization, and interactive management tools for clusters, event queues, and voice runtimes. To address these demands, Shardix v0.9 introduces a standalone, modern web dashboard application engineered with Next.js 15 and React 19, backed by `@shardix/dashboard-api`.

## Decision

We will decouple the web UI from `@shardix/dashboard-api` by implementing a dedicated Next.js 15 frontend application (`@shardix/dashboard-web`).

Key technical choices:
- **Framework**: Next.js 15 with React 19 using the App Router for optimal rendering performance, server-side streaming, and layout composition.
- **Styling & Components**: Tailwind CSS combined with `shadcn/ui` accessible components for consistent enterprise-grade visual design.
- **Server State**: TanStack Query (React Query v5) for HTTP polling, cache invalidation, and optimistic state updates.
- **Real-Time Data**: Dynamic WebSocket connection manager subscribing to real-time metric channels.
- **Data Visualization**: Recharts for rendering responsive time-series charts (CPU/memory usage, event rates, command latency histograms).
- **Backend API**: Retain `@shardix/dashboard-api` as the headless backend REST + WebSocket server.
- **Authentication**: Token-based authentication using configurable secret bearer tokens passed via `Authorization` headers and initial WebSocket handshake auth frames.

## Architecture

```
 +-------------------------------------------------------+
 |                 Shardix Dashboard UI                  |
 |          (Next.js 15 App Router / React 19)           |
 +---------------------------+---------------------------+
                             |
           +-----------------+-----------------+
           |                                   |
    REST API Calls                       WebSocket Stream
(TanStack Query Cache)               (Real-time Telemetry)
           |                                   |
           v                                   v
 +-------------------------------------------------------+
 |                @shardix/dashboard-api                 |
 |             (HTTP Server & WebSocket Hub)             |
 +---------------------------+---------------------------+
                             |
                             v
 +-------------------------------------------------------+
 |                 Shardix Core Runtime                  |
 |  (System, Gateway, Queue, Cluster, Voice, Events)     |
 +-------------------------------------------------------+
```

### Dashboard Panels Structure

The dashboard interface is structured into 10 specialized monitoring and management panels:
1. **Runtime**: Node.js process metrics, uptime, memory heap usage, event loop latency.
2. **Gateway**: Shard connections, gateway event throughput, heartbeat ping times, reconnect counts.
3. **HTTP**: Interaction HTTP endpoint throughput, status codes, response times.
4. **Cluster**: Worker node status, IPC messaging rates, master-worker health checks.
5. **Commands**: Command execution count, error rate, top executed slash commands.
6. **Events**: Internal EventBus activity, event handlers performance.
7. **Performance**: Detailed latency distribution, garbage collection pauses, CPU flamegraphs.
8. **Logs**: Real-time log streaming viewer with severity filtering and correlation ID lookup.
9. **Voice**: Active voice connections, audio stream bitrates, packet loss metrics.
10. **Health**: System readiness checks, provider health probes, dependency status.

### Real-Time Metric Subscription Example

```typescript
// hooks/use-dashboard-metrics.ts
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface MetricFrame {
  timestamp: number;
  cpuUsage: number;
  memoryRssMB: number;
  gatewayEventsPerSec: number;
}

export function useDashboardMetrics(token: string) {
  const [realtimeMetrics, setRealtimeMetrics] = useState<MetricFrame | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:9090/ws?token=${encodeURIComponent(token)}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'METRICS_UPDATE') {
        setRealtimeMetrics(data.payload);
      }
    };

    return () => ws.close();
  }, [token]);

  return { realtimeMetrics };
}
```

## Consequences

### Positive
- Rich interactive dashboard UI with instant feedback and modern visualization tools.
- Clean separation between presentation UI (`@shardix/dashboard-web`) and telemetry REST/WS server (`@shardix/dashboard-api`).
- High performance rendering enabled by React 19 Server Components and Next.js 15 App Router.
- Modular panel structure allowing custom third-party plugin panels to be injected.

### Negative / Trade-offs
- Additional build artifact and node module dependency footprint for the repository.
- Web browser client must maintain active WebSocket connections to receive real-time updates.

## Implementation Notes

- Deployable as a static export (`output: 'export'`) or node server for server-side capabilities.
- Uses `shadcn/ui` dark mode theme by default to match developer-oriented Discord tooling.
- Configurable environment variable `NEXT_PUBLIC_SHARDIX_API_URL` specifies the `@shardix/dashboard-api` host.

## References
- [ADR-0020: Dashboard Architecture](0020-dashboard-architecture.md)
- [ADR-0022: Dashboard Security Model](0022-dashboard-security-model.md)
- [ADR-0023: Dashboard API Contract](0023-dashboard-api-contract.md)
