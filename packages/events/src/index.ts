import EventEmitter from 'eventemitter3';
import { Injectable, Scope } from '@shardix/common';
import Redis from 'ioredis';

export type EventHandler = (data: any) => void | Promise<void>;

@Injectable({ scope: Scope.SINGLETON })
export class EventBus {
  private emitter = new EventEmitter();
  private redisPub?: Redis;
  private redisSub?: Redis;

  public on(event: string, handler: EventHandler): void {
    this.emitter.on(event, handler);
  }

  public off(event: string, handler: EventHandler): void {
    this.emitter.off(event, handler);
  }

  public async emit(event: string, payload: any): Promise<void> {
    this.emitter.emit(event, payload);
    if (this.redisPub) {
      await this.redisPub.publish(`shardix:events:${event}`, JSON.stringify(payload));
    }
  }

  public enableDistributedEvents(redisUrl: string): void {
    this.redisPub = new Redis(redisUrl);
    this.redisSub = new Redis(redisUrl);

    this.redisSub.psubscribe('shardix:events:*');
    this.redisSub.on('pmessage', (_pattern, channel, message) => {
      const eventName = channel.replace('shardix:events:', '');
      try {
        const payload = JSON.parse(message);
        this.emitter.emit(eventName, payload);
      } catch {}
    });
  }

  public async destroy(): Promise<void> {
    if (this.redisPub) await this.redisPub.quit();
    if (this.redisSub) await this.redisSub.quit();
  }
}
