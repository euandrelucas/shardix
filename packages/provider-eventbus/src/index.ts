import { ProviderContract } from '@shardix/common';
import { randomUUID } from 'node:crypto';

export interface EventBusOptions {
  driver?: 'memory' | 'redis';
  redisUrl?: string;
  namespace?: string;
}

export interface EventMeta {
  eventId: string;
  timestamp: number;
  source?: string;
  correlationId?: string;
}

export type EventHandler<T = any> = (payload: T, meta: EventMeta) => Promise<void> | void;

export interface EventSubscription {
  id: string;
  event: string;
  handler: EventHandler;
  once: boolean;
}

export class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private options: EventBusOptions;

  constructor(options?: EventBusOptions) {
    this.options = {
      driver: options?.driver || 'memory',
      redisUrl: options?.redisUrl,
      namespace: options?.namespace || 'shardix',
    };
  }

  /**
   * Subscribes to an event
   */
  public on<T>(event: string, handler: EventHandler<T>): EventSubscription {
    return this.addSubscription(event, handler, false);
  }

  /**
   * Subscribes to an event once
   */
  public once<T>(event: string, handler: EventHandler<T>): EventSubscription {
    return this.addSubscription(event, handler, true);
  }

  private addSubscription(event: string, handler: EventHandler, once: boolean): EventSubscription {
    const sub: EventSubscription = {
      id: randomUUID(),
      event,
      handler,
      once,
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    
    this.subscriptions.get(event)!.push(sub);
    return sub;
  }

  /**
   * Removes a specific subscription by ID
   */
  public off(subscriptionId: string): boolean {
    for (const [event, subs] of this.subscriptions.entries()) {
      const initialLength = subs.length;
      const filtered = subs.filter(s => s.id !== subscriptionId);
      if (filtered.length !== initialLength) {
        this.subscriptions.set(event, filtered);
        return true;
      }
    }
    return false;
  }

  /**
   * Removes all subscriptions for an event
   */
  public offAll(event: string): number {
    const subs = this.subscriptions.get(event);
    if (!subs) return 0;
    
    const count = subs.length;
    this.subscriptions.delete(event);
    return count;
  }

  /**
   * Emits an event to all subscribers
   */
  public async emit<T>(event: string, payload: T, meta?: Partial<EventMeta>): Promise<void> {
    const fullMeta: EventMeta = {
      eventId: meta?.eventId || randomUUID(),
      timestamp: meta?.timestamp || Date.now(),
      source: meta?.source || this.options.namespace,
      correlationId: meta?.correlationId,
    };

    const handlersToCall: EventSubscription[] = [];

    for (const [subEvent, subs] of this.subscriptions.entries()) {
      if (this.matchEvent(event, subEvent)) {
        handlersToCall.push(...subs);
      }
    }

    if (handlersToCall.length === 0) return;

    // Handle 'once' subscriptions
    handlersToCall.forEach(sub => {
      if (sub.once) {
        this.off(sub.id);
      }
    });

    // Execute concurrently
    const promises = handlersToCall.map(async sub => {
      try {
        await sub.handler(payload, fullMeta);
      } catch (error) {
        console.error(`Error in event handler for ${sub.event}:`, error);
      }
    });

    await Promise.all(promises);
  }

  private matchEvent(emitted: string, subscribed: string): boolean {
    if (subscribed === '*') return true;
    if (emitted === subscribed) return true;
    
    if (subscribed.endsWith('.*')) {
      const prefix = subscribed.slice(0, -2);
      return emitted.startsWith(`${prefix}.`);
    }
    
    return false;
  }

  /**
   * Gets all subscriptions, optionally filtered by event
   */
  public getSubscriptions(event?: string): EventSubscription[] {
    if (event) {
      return this.subscriptions.get(event) || [];
    }
    
    const all: EventSubscription[] = [];
    for (const subs of this.subscriptions.values()) {
      all.push(...subs);
    }
    return all;
  }

  /**
   * Gets all registered event names
   */
  public getEventNames(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Enables distributed events (Redis)
   */
  public async enableDistributedEvents(redisUrl: string): Promise<void> {
    this.options.driver = 'redis';
    this.options.redisUrl = redisUrl;
    console.warn(`[EventBus] Redis driver requires ioredis: npm install ioredis. Falling back to memory driver for now.`);
  }

  /**
   * Destroys the event bus and cleans up
   */
  public async destroy(): Promise<void> {
    this.subscriptions.clear();
  }
}

export class EventBusProvider implements ProviderContract {
  public name = 'EventBusProvider';
  public version = '0.9.0';
  private eventBus: EventBus;

  constructor(options?: EventBusOptions) {
    this.eventBus = new EventBus(options);
  }

  public async register(app: any): Promise<void> {
    app.singleton('EventBus', this.eventBus);
  }
  
  public async boot?(): Promise<void> {
    // EventBus is ready; destruction handled via shutdown hook
  }
}

/**
 * Creates an EventBusProvider instance
 */
export function createEventBusProvider(options?: EventBusOptions): EventBusProvider {
  return new EventBusProvider(options);
}
