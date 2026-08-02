import EventEmitter from 'eventemitter3';
import { Injectable, Scope } from '@shardix/common';
import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

export type EventHandler = (data: unknown) => void | Promise<void>;

@Injectable({ scope: Scope.SINGLETON })
export class EventBus {
  private emitter = new EventEmitter();
  private redisPub?: Redis;
  private redisSub?: Redis;
  /** Unique ID for this process — used to prevent loopback double-fire */
  private readonly nodeId = randomUUID();

  public on(event: string, handler: EventHandler): void {
    this.emitter.on(event, handler);
  }

  public once(event: string, handler: EventHandler): void {
    this.emitter.once(event, handler);
  }

  public off(event: string, handler: EventHandler): void {
    this.emitter.off(event, handler);
  }

  public async emit(event: string, payload: unknown): Promise<void> {
    // Always emit locally first
    this.emitter.emit(event, payload);
    // Publish to Redis with our nodeId so subscribers can skip their own messages
    if (this.redisPub) {
      await this.redisPub.publish(
        `shardix:events:${event}`,
        JSON.stringify({ nodeId: this.nodeId, payload })
      );
    }
  }

  public enableDistributedEvents(redisUrl: string): void {
    this.redisPub = new Redis(redisUrl);
    this.redisSub = new Redis(redisUrl);

    this.redisSub.psubscribe('shardix:events:*');
    this.redisSub.on('pmessage', (_pattern, channel, message) => {
      const eventName = channel.replace('shardix:events:', '');
      try {
        const parsed = JSON.parse(message) as { nodeId: string; payload: unknown };
        // Skip messages originating from this node (already emitted locally)
        if (parsed.nodeId === this.nodeId) return;
        this.emitter.emit(eventName, parsed.payload);
      } catch (parseErr: unknown) {
        const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        console.warn(`[EventBus] Failed to parse Redis message on channel "${eventName}": ${msg}`);
      }
    });
  }

  public async destroy(): Promise<void> {
    if (this.redisPub) await this.redisPub.quit();
    if (this.redisSub) await this.redisSub.quit();
  }
}
