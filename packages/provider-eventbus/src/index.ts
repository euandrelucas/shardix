import { ProviderContract } from '@shardix/common';
import { EventBus } from '@shardix/events';

export interface EventBusProviderOptions {
  redisUrl?: string;
}

export class EventBusProvider implements ProviderContract {
  public readonly name = 'EventBusProvider';
  public readonly version = '0.3.0';
  private eventBus: EventBus;

  constructor(options: EventBusProviderOptions = {}) {
    this.eventBus = new EventBus();
    if (options.redisUrl) {
      this.eventBus.enableDistributedEvents(options.redisUrl);
    }
  }

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: EventBus,
      useValue: this.eventBus,
    });
    container.register({
      provide: EventBusProvider,
      useValue: this,
    });
  }

  public async shutdown(): Promise<void> {
    await this.eventBus.destroy();
  }

  public getEventBus(): EventBus {
    return this.eventBus;
  }
}
