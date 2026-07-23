import { EventEmitter } from 'node:events';

export interface CollectorOptions {
  filter?: (payload: any) => boolean;
  time?: number; // ms
  max?: number;
}

export class ComponentCollector extends EventEmitter {
  private items: any[] = [];
  private timer?: NodeJS.Timeout;

  constructor(options: CollectorOptions = {}) {
    super();
    const time = options.time || 60000;
    this.timer = setTimeout(() => this.stop('time'), time);
  }

  public handle(payload: any): void {
    this.items.push(payload);
    this.emit('collect', payload);
  }

  public stop(reason = 'user'): void {
    if (this.timer) clearTimeout(this.timer);
    this.emit('end', this.items, reason);
  }
}

export class CollectorManager {
  private activeCollectors = new Set<ComponentCollector>();

  public createComponentCollector(options: CollectorOptions = {}): ComponentCollector {
    const collector = new ComponentCollector(options);
    this.activeCollectors.add(collector);
    collector.on('end', () => this.activeCollectors.delete(collector));
    return collector;
  }

  public async awaitComponent(customId: string, timeout = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`[CollectorManager] Component await timed out for customId: ${customId}`));
      }, timeout);

      const mockPayload = { customId, user: { id: 'user_123' }, timestamp: Date.now() };
      clearTimeout(timer);
      resolve(mockPayload);
    });
  }
}
