---
title: Event Bus & Distributed Events
description: Decoupled in-process and distributed pub/sub event bus with pattern subscriptions, correlation IDs, and Redis backend for Shardix Discord bots.
---

# 📡 Event Bus & Distributed Events

`@shardix/provider-eventbus` (working alongside `@shardix/events`) provides a decoupled, typed publish-subscribe communication bus for Shardix applications. It allows disparate services, modules, and cluster nodes to react to domain events without direct dependencies.

## Key Capabilities

- 🎯 **In-Memory and Distributed Pub/Sub**: Seamlessly publish locally or across clustered shards via Redis.
- 🔁 **Loopback Protection**: Automatic node ID tagging prevents duplicate event processing on the originating node.
- 🔍 **Wildcards & Pattern Subscriptions**: Listen to all events (`*`) or namespaces (`user.*`, `guild.member.*`).
- 🏷️ **Rich Event Metadata**: Every event carries `eventId`, `correlationId`, `timestamp`, and originating node information.
- 🧩 **DI-first Integration**: Inject `EventBus` anywhere across your application container.

---

## Installation

```bash
npm install @shardix/provider-eventbus @shardix/events
```

For multi-process or multi-shard distributed events, install `ioredis`:

```bash
npm install ioredis
```

---

## Setup & Provider Registration

Register `EventBusProvider` when initializing the Shardix application:

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { EventBusProvider } from '@shardix/provider-eventbus';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    new EventBusProvider({
      // Optional: Set Redis URL to enable distributed cross-shard messaging
      redisUrl: process.env.REDIS_URL,
    }),
  ],
});
```

---

## Core API

The `EventBus` provides familiar pub/sub methods:

### `on(event, handler)`

Subscribes an event listener that triggers every time the event is published.

```ts
eventBus.on('user.registered', async (payload) => {
  console.log('New user registered:', payload);
});
```

### `once(event, handler)`

Subscribes an event listener that executes only once and automatically unregisters.

```ts
eventBus.once('system.ready', async () => {
  console.log('System is initialized and ready!');
});
```

### `off(event, handler)`

Removes a previously registered listener.

```ts
const handler = (data) => console.log(data);
eventBus.on('tick', handler);

// Unregister
eventBus.off('tick', handler);
```

### `emit(event, payload)`

Publishes an event to all local subscribers and broadcasts to the distributed Redis channel if configured.

```ts
await eventBus.emit('guild.joined', {
  guildId: '123456789',
  guildName: 'Developers Hub',
  memberCount: 250,
});
```

---

## Pattern & Wildcard Subscriptions

The EventBus supports wildcard matching for hierarchical event naming:

### 1. Global Wildcard (`*`)
Captures all events across the entire application:

```ts
eventBus.on('*', (event, payload) => {
  console.log(`[Global Audit] Fired event "${event}" with payload:`, payload);
});
```

### 2. Namespace Patterns (`user.*`, `guild.*`)
Captures all sub-events within a specific category:

```ts
// Listens to user.created, user.updated, user.deleted, user.warned, etc.
eventBus.on('user.*', (payload) => {
  console.log('User lifecycle event occurred:', payload);
});
```

---

## Event Metadata & Envelopes

Events dispatched through the bus are wrapped in standard metadata envelopes, making tracking and distributed tracing easy:

```ts
export interface EventEnvelope<T = unknown> {
  /** Unique UUID v4 identifying this single event invocation */
  eventId: string;
  /** Correlation ID carried across service workflows for tracing */
  correlationId?: string;
  /** ISO-8601 UTC timestamp of creation */
  timestamp: string;
  /** Unique identifier of the originating worker or cluster node */
  nodeId: string;
  /** Event payload */
  payload: T;
}
```

When emitting custom payloads, you can pass correlation contexts:

```ts
await eventBus.emit('payment.received', {
  orderId: 'ord_9876',
  amount: 49.99,
  currency: 'USD',
}, {
  correlationId: ctx.correlationId,
});
```

---

## Distributed Events Architecture (Redis)

When `redisUrl` is provided to `EventBusProvider`:
1. Every local `emit('event.name', payload)` automatically executes local listeners first.
2. The payload is published to Redis pub/sub under `shardix:events:event.name` with a node identifier (`nodeId`).
3. Clustered bot shards running in other containers subscribe to `shardix:events:*`.
4. Incoming Redis messages compare `nodeId` to skip messages originating on the same instance, preventing loopback double-execution.

```
       [ Cluster Node 1 ]                      [ Cluster Node 2 ]
    +-----------------------+              +-----------------------+
    | emit('user.banned')   |              | on('user.banned')     |
    |  -> Local listeners   |              |  -> Remote listener   |
    +-----------+-----------+              +-----------^-----------+
                |                                      |
                |   PUBLISH (shardix:events:...)       |  PSUBSCRIBE
                +-----------------> [ Redis ] ---------+
```

---

## Dependency Injection (DI) Pattern

Inject `EventBus` into any `@Injectable()` service or `@Controller()`:

```ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';

@Injectable()
export class AuditLogService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {
    this.setupListeners();
  }

  private setupListeners() {
    this.eventBus.on('moderation.*', async (eventData) => {
      await this.saveAuditLogEntry(eventData);
    });
  }

  private async saveAuditLogEntry(entry: unknown) {
    console.log('[Audit] Recorded:', entry);
  }
}
```

---

## Real-World Bot Example: Cross-Service Communication

### Scenario: Moderation Warning Triggers Multiple Independent Systems

When a moderator issues a `/warn` command:
1. `ModerationService` updates the database and emits `moderation.user_warned`.
2. `AuditLogService` listens to `moderation.*` and sends an embed to the `#mod-logs` channel.
3. `LevelingService` listens to `moderation.user_warned` and penalizes user XP.
4. `DmNotificationService` queues a DM to the member.

Each service remains 100% decoupled from the others!

```ts
// src/events/moderation.events.ts
export interface UserWarnedEvent {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  warnCount: number;
}
```

```ts
// src/services/moderation.service.ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';
import type { UserWarnedEvent } from '../events/moderation.events';

@Injectable()
export class ModerationService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {}

  async warnUser(guildId: string, userId: string, moderatorId: string, reason: string) {
    // 1. Save warning to database
    const warnCount = 3; // e.g. await db.warnings.count(...)

    // 2. Publish domain event
    await this.eventBus.emit('moderation.user_warned', {
      guildId,
      userId,
      moderatorId,
      reason,
      warnCount,
    } satisfies UserWarnedEvent);

    return warnCount;
  }
}
```

```ts
// src/services/leveling.service.ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';
import type { UserWarnedEvent } from '../events/moderation.events';

@Injectable()
export class LevelingService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {
    this.eventBus.on('moderation.user_warned', (payload) => {
      this.deductXp(payload as UserWarnedEvent);
    });
  }

  private async deductXp(event: UserWarnedEvent) {
    console.log(`[Leveling] Penalizing user ${event.userId} -50 XP due to warning`);
  }
}
```

```ts
// src/services/audit-log.service.ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';

@Injectable()
export class AuditLogService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {
    // Wildcard pattern matches all moderation actions: user_warned, user_banned, user_kicked
    this.eventBus.on('moderation.*', (data) => {
      this.writeLog(data);
    });
  }

  private async writeLog(data: unknown) {
    console.log('[Audit Log Channel] Event recorded:', data);
  }
}
```
