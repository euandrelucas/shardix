---
title: Scheduler — @Cron, @Interval, @Timeout
description: Schedule recurring tasks and cron jobs directly in your Discord bot using Shardix's decorator-based scheduler.
---

# ⏰ Scheduler

`@shardix/scheduler` provides a decorator-driven scheduling system that lets you define recurring tasks, intervals, and one-shot timeouts directly on your service classes — no separate cron runner or external daemon required.

## Installation

```bash
npm install @shardix/scheduler
```

## Setup

Register `SchedulerProvider` when creating your application:

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { SchedulerProvider } from '@shardix/scheduler';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [new SchedulerProvider()],
});
```

---

## Decorators

### `@Cron(expression, options?)`

Runs the decorated method on a standard 5-field cron expression.

```ts
import { Injectable } from '@shardix/common';
import { Cron } from '@shardix/scheduler';

@Injectable()
export class MaintenanceService {
  // Every day at midnight
  @Cron('0 0 * * *')
  async purgeExpiredData() {
    await database.purgeExpired();
  }

  // Every Monday at 9am
  @Cron('0 9 * * 1', { name: 'weekly-report', runOnInit: false })
  async sendWeeklyReport() {
    await reports.sendSummary();
  }

  // Every 15 minutes
  @Cron('*/15 * * * *')
  async syncCache() {
    await cache.sync();
  }
}
```

**Cron expression format:**
```
┌───────── minute (0-59)
│ ┌───────── hour (0-23)
│ │ ┌───────── day of month (1-31)
│ │ │ ┌───────── month (1-12)
│ │ │ │ ┌───────── day of week (0-7, 0 and 7 are Sunday)
│ │ │ │ │
* * * * *
```

**Supported patterns:** `*`, `1-5` (ranges), `1,3,5` (lists), `*/15` (steps)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | method name | Job name for registry lookup |
| `timeZone` | `string` | system | e.g. `'America/New_York'` |
| `runOnInit` | `boolean` | `false` | Run immediately on bot boot |
| `disabled` | `boolean` | `false` | Register but don't start |

---

### `@Interval(ms, options?)`

Repeats the method every N milliseconds.

```ts
@Injectable()
export class StatusService {
  // Check every 30 seconds
  @Interval(30_000, { name: 'heartbeat' })
  async sendHeartbeat() {
    await statusPage.ping();
  }

  // Sync leaderboard every 5 minutes
  @Interval(5 * 60 * 1000)
  async syncLeaderboard() {
    await leaderboard.refresh();
  }
}
```

---

### `@Timeout(ms, options?)`

Runs the method exactly once after N milliseconds from boot.

```ts
@Injectable()
export class BotStartupService {
  // Announce online status 5 seconds after startup
  @Timeout(5_000, { name: 'startup-announce' })
  async announceOnline() {
    await announceChannel.send('Bot is online! 🚀');
  }

  // Pre-warm cache 2 seconds after boot
  @Timeout(2_000)
  async prewarmCache() {
    await cache.preload();
  }
}
```

---

## SchedulerRegistry

Access and control running jobs programmatically:

```ts
import { SchedulerRegistry } from '@shardix/scheduler';

@Injectable()
export class AdminService {
  constructor(@Inject(SchedulerRegistry) private scheduler: SchedulerRegistry) {}

  // Pause a job
  async pauseHeartbeat() {
    this.scheduler.stop('heartbeat');
  }

  // Resume it
  async resumeHeartbeat() {
    this.scheduler.start('heartbeat');
  }

  // Get stats
  getStats() {
    return this.scheduler.getStats();
    // { totalJobs: 4, runningJobs: 3, stoppedJobs: 1, totalExecutions: 1240, totalErrors: 0 }
  }

  // Inspect a specific job
  getJobInfo() {
    const job = this.scheduler.get('weekly-report');
    // { name, type, status, lastRun, nextRun, runCount, errorCount }
    return job;
  }
}
```

---

## Full Example

```ts
import { Injectable, Controller, SlashCommand } from '@shardix/common';
import { Cron, Interval, Timeout, SchedulerRegistry } from '@shardix/scheduler';
import type { CommandContext } from '@shardix/common';

@Injectable()
export class GameService {
  private scores = new Map<string, number>();

  @Cron('0 0 * * 0', { name: 'reset-weekly' }) // Every Sunday midnight
  async resetWeeklyScores() {
    this.scores.clear();
    console.log('[Scheduler] Weekly scores reset');
  }

  @Interval(60_000) // Every minute
  async broadcastTopPlayers() {
    const top = [...this.scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    console.log('[Scheduler] Top 3:', top);
  }

  @Timeout(3_000) // 3s after boot
  async announceSeasonStart() {
    console.log('[Scheduler] New season started!');
  }

  addScore(userId: string, points: number) {
    this.scores.set(userId, (this.scores.get(userId) ?? 0) + points);
  }
}

@Controller()
export class GameController {
  constructor(@Inject(GameService) private game: GameService) {}

  @SlashCommand({ name: 'score', description: 'Add points' })
  async score(ctx: CommandContext) {
    this.game.addScore(ctx.userId, 10);
    return ctx.reply({ content: '+10 points!' });
  }
}
```

---

## Graceful Shutdown

The `SchedulerProvider` automatically registers shutdown hooks. When `app.stop()` is called:
1. No new job executions are started
2. Currently running jobs are allowed to complete (up to 30s timeout)
3. All timers are cleared

---

## Without Framework (standalone)

```ts
import { SchedulerService, SchedulerRegistry } from '@shardix/scheduler';

const registry = new SchedulerRegistry();
const scheduler = new SchedulerService(registry);

scheduler.scheduleJob({
  name: 'my-task',
  type: 'interval',
  intervalMs: 5000,
  handler: async () => console.log('tick'),
  options: {},
  runCount: 0,
  errorCount: 0,
  status: 'idle',
});
```
