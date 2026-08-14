# ADR-0049: Enhanced Queue System Provider (`@shardix/provider-queue`)

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, queue, bullmq, decorators, async-jobs

## Context

In production Discord bot operations, asynchronous workload processing—such as sending batch embed updates, generating image attachments, processing database migrations, or executing webhook dispatches—must be offloaded from main interaction event loops. The initial implementation of `@shardix/provider-queue` offered rudimentary in-memory queueing but lacked job retry strategies, priority handling, driver abstractions, dead letter queues (DLQ), and declarative processor discovery.

To support high-reliability background processing across single-instance and distributed cluster deployments, `@shardix/provider-queue` receives significant structural enhancements in Shardix v0.9.

## Decision

We will upgrade `@shardix/provider-queue` into an enterprise job processing framework featuring declarative class decorators, pluggable driver architectures (`MemoryDriver` and `RedisDriver`), exponential backoff retries, dead letter queues, and native Shardix Dashboard metric integration.

Key Enhancements:
1. **Declarative Decorators**:
   - `@QueueProcessor(queueName)`: Registers a class as a processor for a named queue.
   - `@Process(jobName?)`: Decorates method handlers within a queue processor.
2. **Flexible Job Options**: Delay execution, priority queues, retry attempt limits, and backoff strategies (`fixed` or `exponential`).
3. **Lifecycle Hooks**: Event listeners for job lifecycle states (`onActive`, `onCompleted`, `onFailed`).
4. **Pluggable Drivers**:
   - `MemoryDriver` (default): Lightweight, zero-dependency in-process priority queue.
   - `RedisDriver`: High-throughput, distributed Redis queue backed by BullMQ (optional peer dependency).
5. **Dead Letter Queue (DLQ)**: Failed jobs that exhaust maximum retry attempts are automatically moved to a designated DLQ for inspection and manual replay.
6. **Dashboard Integration**: Exposes queue statistics (active, waiting, completed, failed, delayed, DLQ counts) to `@shardix/dashboard-api`.

## Architecture

```
 +------------------------------------------------------------------+
 |                        Shardix Application                       |
 |             QueueService.add('notifications', payload)            |
 +--------------------------------+---------------------------------+
                                  |
                                  v
 +------------------------------------------------------------------+
 |                     QueueProvider Architecture                   |
 |  +------------------------------------------------------------+  |
 |  |                     Driver Abstraction                      |  |
 |  |       MemoryDriver (Default)  |  RedisDriver (BullMQ)      |  |
 |  +------------------------------+-----------------------------+  |
 +--------------------------------+---------------------------------+
                                  |
            +---------------------+---------------------+
            |                                           |
            v                                           v
 +--------------------+                       +--------------------+
 | @QueueProcessor()  |                       |  Dead Letter Queue |
 | @Process() Methods |                       |     (DLQ Store)    |
 +---------+----------+                       +---------+----------+
           |                                            |
           +----------------------+---------------------+
                                  |
                                  v
                     +--------------------------+
                     |  Shardix Dashboard API   |
                     |  (Real-Time Queue Stats) |
                     +--------------------------+
```

### Code Example: Declarative Queue Processor & Handlers

```typescript
import { QueueProcessor, Process, Job, OnJobCompleted, OnJobFailed } from '@shardix/provider-queue';

@QueueProcessor('notifications')
export class NotificationQueueProcessor {

  @Process('send-welcome-embed')
  async handleWelcomeEmbed(job: Job<{ userId: string; guildId: string }>) {
    const { userId, guildId } = job.data;
    // Execute embed dispatch logic...
    return { status: 'sent', recipient: userId };
  }

  @OnJobCompleted()
  async onCompleted(job: Job, result: any) {
    console.log(`Job ${job.id} on queue ${job.queueName} completed with result:`, result);
  }

  @OnJobFailed()
  async onFailed(job: Job, error: Error) {
    console.error(`Job ${job.id} failed after ${job.attempts} attempts: ${error.message}`);
  }
}
```

### Dispatching Jobs with Options & Exponential Backoff

```typescript
import { Injectable } from '@shardix/core';
import { QueueService } from '@shardix/provider-queue';

@Injectable()
export class UserService {
  constructor(private readonly queueService: QueueService) {}

  async dispatchWelcomeNotification(userId: string, guildId: string) {
    await this.queueService.add(
      'notifications',
      'send-welcome-embed',
      { userId, guildId },
      {
        delay: 5000,           // 5 second delay
        priority: 1,           // High priority
        attempts: 5,           // Maximum 5 retries
        backoff: {
          type: 'exponential', // 1s, 2s, 4s, 8s, ...
          delay: 1000,
        },
      }
    );
  }
}
```

## Consequences

### Positive
- Production-ready job processing with zero external dependencies required out of the box (`MemoryDriver`).
- Smooth transition to distributed setups by swapping to `RedisDriver` without altering business logic code.
- Automatic retry handling with exponential backoff prevents transient Discord API failures from losing tasks.
- Dead Letter Queue guarantees no failed jobs are silently lost.

### Negative / Trade-offs
- `MemoryDriver` state is lost on process crash; production multi-node environments must use `RedisDriver`.
- Utilizing `RedisDriver` introduces BullMQ as a peer dependency.

## Implementation Notes

- Extends `@shardix/provider-queue`.
- Discovers processors by scanning class metadata registered via `@QueueProcessor`.
- `QueueProvider` implements `ProviderContract` to manage driver connection pools and graceful queue draining on application shutdown.

## References
- [ADR-0018: Queue System](0018-queue-system.md)
- [ADR-0046: Next.js 15 Web Dashboard Architecture](0046-v09-dashboard-web-architecture.md)
