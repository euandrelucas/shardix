# ADR-0048: Scheduler System Package (`@shardix/scheduler`)

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, scheduler, cron, decorators, tasks

## Context

Enterprise Discord applications frequently require background periodic tasks, delayed execution timers, recurring maintenance operations (such as cache clearing or user reminder dispatching), and scheduled status rotations. Previously, developers had to manual instantiate `setInterval`, `setTimeout`, or third-party cron packages inside provider initializations, leading to boilerplate code, unhandled promise rejections, memory leaks, and lack of dynamic job controls.

Shardix v0.9 introduces `@shardix/scheduler`, a native task scheduling package providing declarative method decorators, auto-discovery, lifecycle controls, optional multi-instance Redis state persistence, and graceful termination.

## Decision

We will implement `@shardix/scheduler` as a core monorepo package that seamlessly integrates with Shardix's IoC container and metadata reflection pipeline.

Key Features:
1. **Declarative Decorators**: `@Cron(expression, options?)`, `@Interval(ms)`, and `@Timeout(ms)`.
2. **Auto-Discovery**: Scans registered `@Injectable` services and controllers during application boot for method scheduling metadata.
3. **SchedulerRegistry**: Central registry allowing programmatic query, inspection, pause, resume, manual invocation, and removal of scheduled jobs.
4. **SchedulerProvider**: Implements `ProviderContract`. Initializes timers during `boot(app)` lifecycle hook and cleans up active timers during shutdown.
5. **Runtime Engine**: Uses native `node:timers` / `node:timers/promises` for intervals and timeouts. Integrates `node-cron` via dynamic `import()` to keep cron dependencies optional.
6. **Distributed State & Redis Persistence**: Optional persistence using `@shardix/cache` to store job last-run timestamps and lock execution across clustered instances.
7. **Zero Breaking Changes**: Fully additive package that leaves existing framework packages intact.

## Architecture

```
 +-----------------------------------------------------------------+
 |                    Shardix Application IoC                      |
 |         @Injectable Services with @Cron / @Interval             |
 +--------------------------------+--------------------------------+
                                  | Metadata Inspection
                                  v
 +-----------------------------------------------------------------+
 |                        SchedulerProvider                        |
 |                   (ProviderContract Lifecycle)                  |
 +--------------------------------+--------------------------------+
                                  | Registers Task Handles
                                  v
 +-----------------------------------------------------------------+
 |                        SchedulerRegistry                        |
 |            +-------------------+-------------------+            |
 |            | Cron Job Registry | Interval Registry |            |
 |            +---------+---------+---------+---------+            |
 +----------------------|-------------------|----------------------+
                        |                   |
                        v                   v
              +-------------------+ +-------------------+
              |    node-cron      | | node:timers Engine|
              | (Dynamic Import)  | |  (Native Node.js) |
              +---------+---------+ +---------+---------+
                        |                   |
                        +---------+---------+
                                  |
                                  v (Optional)
                        +-------------------+
                        |   @shardix/cache  |
                        | (Redis Locks/State|
                        +-------------------+
```

### Code Example: Declarative Task Decorators

```typescript
import { Injectable } from '@shardix/core';
import { Cron, Interval, Timeout } from '@shardix/scheduler';

@Injectable()
export class SystemMaintenanceService {

  @Cron('0 0 * * *', { name: 'daily-database-cleanup' })
  async handleDailyCleanup() {
    // Executes every day at midnight
  }

  @Interval(30_000, { name: 'heartbeat-ping' })
  async sendHeartbeat() {
    // Executes every 30 seconds
  }

  @Timeout(5_000)
  async deferredInitialization() {
    // Executes 5 seconds after application boot completes
  }
}
```

### Dynamic Import of `node-cron` & Registry Implementation

```typescript
export class SchedulerRegistry {
  private cronJobs = new Map<string, any>();
  private intervals = new Map<string, NodeJS.Timeout>();

  public async registerCronJob(name: string, cronExpr: string, handler: Function): Promise<void> {
    try {
      const cronModule = await import('node-cron');
      const job = cronModule.schedule(cronExpr, () => handler());
      this.cronJobs.set(name, job);
    } catch (err) {
      throw new Error(`Package 'node-cron' is required for @Cron decorators. Please install it.`);
    }
  }

  public stop(name: string): void {
    if (this.cronJobs.has(name)) {
      this.cronJobs.get(name)?.stop();
    } else if (this.intervals.has(name)) {
      clearInterval(this.intervals.get(name));
    }
  }
}
```

## Consequences

### Positive
- Clean, declarative API matching framework conventions (`@Cron`, `@Interval`, `@Timeout`).
- Flexible dependency model: `node-cron` is an optional peer dependency, keeping bundle lean for projects only using `@Interval`.
- Distributed cluster safety through optional `@shardix/cache` Redis locks.
- Programmatic control through `SchedulerRegistry` enables dashboard manipulation of active jobs.

### Negative / Trade-offs
- Dynamic imports for `node-cron` require clear documentation for users adding cron functionalities.
- In multi-node setups without Redis locking configured, cron tasks will run independently on every node.

## Implementation Notes

- Exported from `@shardix/scheduler`.
- Registers `@Cron`, `@Interval`, and `@Timeout` metadata using `reflect-metadata`.
- `SchedulerProvider.boot()` iterates over IoC container bindings to register active decorated targets.

## References
- [ADR-0008: Provider Architecture](0008-provider-architecture.md)
- [ADR-0031: Cache Architecture](0031-cache-architecture.md)
