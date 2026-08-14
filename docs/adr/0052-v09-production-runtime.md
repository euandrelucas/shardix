# ADR-0052: Production Runtime Reliability and Resilience Architecture

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, production, runtime, fault-tolerance, hot-reload, pm2

## Context

Enterprise Discord applications operating at scale require high availability, crash resilience, state preservation during updates, and clean integrations with process managers such as PM2, Kubernetes, and systemd. Previous Shardix versions terminated immediately on uncaught exceptions, lost in-flight request states during restarts, and required full process restarts during local development when updating command handlers or providers.

Shardix v0.9 introduces production runtime resilience enhancements in `@shardix/core` and `@shardix/runtime` focused on crash recovery, state persistence, graceful connection draining, process manager signaling, and developer Hot Module Reloading (HMR).

## Decision

We will implement a multi-layered production runtime manager into Shardix core runtime engine.

Key Reliability Modules:
1. **CrashRecovery**: Intercepts unhandled promise rejections and uncaught exceptions. Executes configured restart backoff strategies (e.g., exponential delay) with maximum retry thresholds before declaring process failure.
2. **GracefulShutdown**: Listens to system signals (`SIGINT`, `SIGTERM`, `SIGUSR2`). Stops receiving new gateway events, drains in-flight interaction handlers and active queue jobs up to a configurable timeout (default: 15,000ms), and closes database/provider connections cleanly before process exit.
3. **StateSnapshot & StateRecovery**: Serializes designated critical in-memory state objects (e.g., active user sessions, temporary interaction flows) to disk or Redis JSON format during graceful shutdown, restoring state seamlessly upon startup.
4. **Hot Module Reloading (HMR)**: Development watch-mode subsystem that re-compiles and re-binds updated controllers, command modules, and providers in memory without restarting the Node.js process or re-establishing Discord Gateway WebSocket connections.
5. **ProcessManager Integration**: Sends PM2 readiness IPC notifications (`process.send('ready')`), handles PM2 graceful shutdown events, and exposes systemd notify sockets.

## Architecture

```
 +-------------------------------------------------------------------+
 |                       Process Environment                         |
 |                    (PM2 / systemd / Docker / K8s)                 |
 +----------------------------------+--------------------------------+
                                    | Signals (SIGINT, SIGTERM)
                                    v
 +-------------------------------------------------------------------+
 |                    Shardix Production Runtime                     |
 |                                                                   |
 |  +--------------------+  +--------------------+                   |
 |  |   CrashRecovery    |  |  GracefulShutdown  |                   |
 |  | (Backoff & Retry)  |  |  (Drain & Timeout) |                   |
 |  +---------+----------+  +---------+----------+                   |
 |            |                       |                              |
 |            +-----------+-----------+                              |
 |                        |                                          |
 |                        v                                          |
 |  +--------------------------------------------+                   |
 |  |        StateSnapshot & StateRecovery       |                   |
 |  |    (In-Memory -> JSON Disk/Redis -> Restore) |                   |
 |  +--------------------------------------------+                   |
 |                        |                                          |
 |                        v                                          |
 |  +--------------------------------------------+                   |
 |  |          Dev Hot Module Reload (HMR)       |                   |
 |  |     (Re-bind Controllers without Restart)  |                   |
 |  +--------------------------------------------+                   |
 +-------------------------------------------------------------------+
```

### Code Example: Graceful Shutdown & Snapshot Configuration

```typescript
import { ShardixFactory } from '@shardix/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await ShardixFactory.create(AppModule, {
    production: {
      crashRecovery: {
        enabled: true,
        maxRetries: 5,
        backoffMs: 2000,
      },
      gracefulShutdown: {
        enabled: true,
        timeoutMs: 15_000,
        signals: ['SIGINT', 'SIGTERM'],
      },
      stateSnapshot: {
        enabled: true,
        storagePath: './storage/state-snapshot.json',
      },
      pm2Integration: true,
    },
  });

  await app.listen();
}

bootstrap();
```

### Process Manager Handshake Implementation

```typescript
export class ProcessManagerNotifier {
  public notifyReady(): void {
    if (process.send) {
      // Signal PM2 that application is ready to accept traffic
      process.send('ready');
    }
  }

  public registerSignalHandlers(shutdownFn: () => Promise<void>): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    for (const signal of signals) {
      process.on(signal, async () => {
        console.log(`Received ${signal}. Initiating graceful shutdown...`);
        await shutdownFn();
        process.exit(0);
      });
    }
  }
}
```

## Consequences

### Positive
- Zero dropped interaction requests during deployments when using PM2 zero-downtime reloads.
- State preservation across process restarts prevents lost temporary interaction wizard states.
- Rapid developer feedback loop using dev HMR (no gateway reconnection delays).
- Enterprise orchestration compatibility (Kubernetes liveness/readiness probes, PM2 ready signals).

### Negative / Trade-offs
- State snapshotting requires developers to explicitly designate serializable state targets.
- Development HMR requires careful garbage collection to prevent memory leaks from retained module references.

## Implementation Notes

- Implemented within `@shardix/core` and `@shardix/runtime`.
- Controlled via application bootstrap options object passed to `ShardixFactory.create()`.
- HMR integrates with `tsup` / `esbuild` file watchers during development mode (`shardix dev`).

## References
- [ADR-0003: Runtime Architecture](0003-runtime-architecture.md)
- [ADR-0014: Distributed Runtime](0014-distributed-runtime.md)
- [ADR-0037: Gateway Runtime](0037-gateway-runtime.md)
