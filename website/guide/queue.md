---
title: Queue System — Background Jobs & Workers
description: Enterprise job queue and background worker processing for Shardix Discord bots with retries, priorities, dead letter queues, and BullMQ/Redis integration.
---

# 📬 Queue System

`@shardix/provider-queue` provides a production-grade background job queue system for Discord bots. It allows you to offload resource-intensive, slow, or rate-limited operations (such as generating dynamic rank cards, dispatching mass direct messages, synchronizing databases, or publishing webhook notifications) out of the main interaction event loop.

## Features

- ⚡ **Zero-dependency In-Memory Driver** (`MemoryDriver`) by default for instant local setup
- 🚀 **Scalable Distributed Driver** (`RedisDriver`) powered by Redis / BullMQ for cluster setups
- 🔄 **Automatic Retries & Backoff** (fixed or exponential backoff strategies)
- 🪦 **Dead Letter Queue (DLQ)** to inspect and recover unprocessable jobs without data loss
- 🎯 **Declarative Decorators**: `@QueueProcessor`, `@Process`, `@OnJobActive`, `@OnJobCompleted`, `@OnJobFailed`
- 📊 **Real-time Queue Metrics**: active, waiting, completed, failed, delayed, and DLQ counts
- 🧩 **DI-first Architecture**: inject `QueueService` into any controller, service, or guard

---

## Installation

```bash
npm install @shardix/provider-queue
```

For distributed Redis-backed clusters, install optional peer dependencies:

```bash
npm install ioredis bullmq
```

---

## Quick Setup

Register `QueueProvider` when bootstrapping your Shardix bot:

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { QueueProvider } from '@shardix/provider-queue';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    new QueueProvider({
      driver: 'memory', // or 'redis'
      redisUrl: process.env.REDIS_URL,
    }),
  ],
});
```

---

## Basic Usage

### Dispatching Jobs with `queue.add()`

Use `QueueService.add(queueName, jobName, data, options?)` or `QueueService.add(queueName, data, options?)` to dispatch background jobs:

```ts
import { Inject, Injectable } from '@shardix/common';
import { QueueService } from '@shardix/provider-queue';

@Injectable()
export class NotificationService {
  constructor(@Inject(QueueService) private queue: QueueService) {}

  async sendWelcomeNotice(userId: string, guildName: string) {
    const job = await this.queue.add('notifications', 'welcome-dm', {
      userId,
      guildName,
      createdAt: new Date(),
    });

    console.log(`Dispatched job with ID: ${job.id}`);
  }
}
```

### Processing Jobs Programmatically with `queue.process()`

```ts
import { QueueService, Job } from '@shardix/provider-queue';

queueService.process('notifications', async (job: Job<{ userId: string; guildName: string }>) => {
  console.log(`Processing job ${job.id} for user ${job.data.userId}`);
  // Execute heavy logic...
});
```

---

## Job Options & Retries

Customize execution timing, execution order, and fault tolerance:

```ts
await queueService.add(
  'reports',
  'generate-monthly-stats',
  { guildId: '123456789' },
  {
    // Execution delay in milliseconds (e.g., run after 5 seconds)
    delay: 5000,

    // Priority (lower numbers mean higher priority: 1 runs before 10)
    priority: 1,

    // Maximum retry attempts on failure
    attempts: 3,

    // Backoff configuration between retries
    backoff: {
      type: 'exponential', // 'fixed' | 'exponential'
      delay: 2000,         // initial delay in ms (2s -> 4s -> 8s)
    },

    // Job timeout in milliseconds before throwing TimeoutError
    timeout: 30_000,

    // Auto-remove job upon successful completion to save memory
    removeOnComplete: true,
  }
);
```

| Option | Type | Default | Description |
|---|---|---|---|
| `delay` | `number` | `0` | Milliseconds to wait before the job becomes eligible to run |
| `priority` | `number` | `0` | Job priority ordering (lower value = higher priority) |
| `attempts` | `number` | `1` | Total retry attempts before transferring to the Dead Letter Queue |
| `backoff` | `JobBackoffOptions` | `{ type: 'fixed', delay: 1000 }` | Strategy between retries (`'fixed'` or `'exponential'`) |
| `timeout` | `number` | `undefined` | Execution timeout in milliseconds |
| `removeOnComplete` | `boolean` | `false` | Whether to purge the job after completion |

---

## Dead Letter Queue (DLQ)

When a job fails and exhausts all configured `attempts`, it is not discarded. Instead, it is automatically routed to the **Dead Letter Queue (DLQ)**.

```ts
// Inspect dead-lettered jobs
const failedJobs = await queueService.getDeadLetterJobs('notifications');

for (const deadJob of failedJobs) {
  console.error(`Dead job ${deadJob.id}: ${deadJob.failedReason}`);
  
  // Re-enqueue for another run after fixing the root cause
  if (deadJob.canRetry) {
    await queueService.retryDeadLetterJob('notifications', deadJob.id);
  }
}
```

---

## Declarative Decorators: `@QueueProcessor`

Shardix provides full decorator support for defining clean, structured queue consumer classes:

```ts
import { Injectable } from '@shardix/common';
import {
  QueueProcessor,
  Process,
  OnJobActive,
  OnJobCompleted,
  OnJobFailed,
  Job,
} from '@shardix/provider-queue';

interface WelcomePayload {
  userId: string;
  guildId: string;
  username: string;
}

@QueueProcessor('welcome-system')
@Injectable()
export class WelcomeQueueProcessor {

  @Process('send-welcome-dm')
  async handleWelcomeDm(job: Job<WelcomePayload>) {
    const { userId, username, guildId } = job.data;
    
    // Simulate sending DM or rendering attachment
    console.log(`[Queue] Sending welcome message to @${username} (${userId})`);
    
    return { delivered: true, recipient: userId };
  }

  @OnJobActive()
  async onActive(job: Job) {
    console.log(`[Queue] Job ${job.id} on queue "${job.queueName}" has started execution.`);
  }

  @OnJobCompleted()
  async onCompleted(job: Job, result: any) {
    console.log(`[Queue] Job ${job.id} completed successfully with result:`, result);
  }

  @OnJobFailed()
  async onFailed(job: Job, error: Error) {
    console.error(`[Queue] Job ${job.id} failed on attempt ${job.attempts}: ${error.message}`);
  }
}
```

---

## Queue Stats & Monitoring

Inspect the health and throughput of your queues programmatically or via Shardix Dashboard:

```ts
const stats = await queueService.getStats('welcome-system');

console.log(stats);
// Output:
// {
//   queue: 'welcome-system',
//   waiting: 12,
//   active: 2,
//   completed: 1540,
//   failed: 3,
//   delayed: 5,
//   deadLetterCount: 1,
//   throughputPerMinute: 68
// }
```

---

## Real-World Discord Bot Example

### Scenario: Offloading DM Delivery After a Slash Command

Discord slash commands require an initial response within 3 seconds. If a command involves sending private messages to dozens of users or fetching heavy external assets, doing so synchronously inside the command handler risks timing out.

With `@shardix/provider-queue`, respond immediately and offload the work safely.

```ts
// src/services/dm-queue.processor.ts
import { Injectable } from '@shardix/common';
import { QueueProcessor, Process, Job, OnJobFailed } from '@shardix/provider-queue';
import { DiscordClient } from '@shardix/core';

interface DirectMessageJobData {
  targetUserId: string;
  moderatorId: string;
  message: string;
}

@QueueProcessor('moderation-dm')
@Injectable()
export class ModerationDmProcessor {
  constructor(@Inject(DiscordClient) private client: DiscordClient) {}

  @Process('send-warning-dm')
  async processWarningDm(job: Job<DirectMessageJobData>) {
    const { targetUserId, message } = job.data;
    
    const user = await this.client.users.fetch(targetUserId);
    if (!user) {
      throw new Error(`User ${targetUserId} not found`);
    }

    await user.send({
      content: `⚠️ **Official Warning**: ${message}`,
    });

    return { delivered: true, timestamp: Date.now() };
  }

  @OnJobFailed()
  async onFailed(job: Job<DirectMessageJobData>, error: Error) {
    console.warn(`[ModDM] Failed to deliver DM to user ${job.data.targetUserId}: ${error.message}`);
  }
}
```

```ts
// src/controllers/warn.controller.ts
import { Controller, SlashCommand, Inject } from '@shardix/common';
import { QueueService } from '@shardix/provider-queue';
import type { CommandContext } from '@shardix/common';

@Controller()
export class ModerationController {
  constructor(@Inject(QueueService) private queue: QueueService) {}

  @SlashCommand({
    name: 'warn',
    description: 'Warn a guild member and send them a private notification',
  })
  async warnUser(ctx: CommandContext) {
    const targetUserId = ctx.getOption<string>('user');
    const reason = ctx.getOption<string>('reason') ?? 'No reason provided';

    // 1. Reply to Discord immediately (under 50ms)
    await ctx.reply({
      content: `✅ User <@${targetUserId}> has been warned. A notification is queued.`,
      ephemeral: true,
    });

    // 2. Offload delivery to background queue with retries
    await this.queue.add(
      'moderation-dm',
      'send-warning-dm',
      {
        targetUserId,
        moderatorId: ctx.userId,
        message: reason,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1500 },
        removeOnComplete: true,
      }
    );
  }
}
```

---

## Graceful Shutdown

When calling `app.stop()`:
1. Running worker loops pause accepting new jobs.
2. In-flight jobs are allowed to complete gracefully within a 15-second grace period.
3. Redis client connection pools close cleanly without orphaned locks.
