import { EventEmitter } from 'node:events';

export interface CollectorOptions {
  filter?: (payload: any) => boolean;
  time?: number; // ms
  max?: number;
  idle?: number;
}

export class BaseCollector extends EventEmitter {
  protected items: any[] = [];
  protected timer?: NodeJS.Timeout;
  protected idleTimer?: NodeJS.Timeout;
  protected ended = false;

  constructor(protected options: CollectorOptions = {}) {
    super();
    if (options.time) {
      this.timer = setTimeout(() => this.stop('time'), options.time);
    }
  }

  public handle(payload: any): boolean {
    if (this.ended) return false;
    if (this.options.filter && !this.options.filter(payload)) {
      return false;
    }

    this.items.push(payload);
    this.emit('collect', payload);

    if (this.options.max && this.items.length >= this.options.max) {
      this.stop('limit');
    }
    return true;
  }

  public stop(reason = 'user'): void {
    if (this.ended) return;
    this.ended = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.emit('end', this.items, reason);
  }

  public async *[Symbol.asyncIterator](): AsyncGenerator<any, void, unknown> {
    const queue: any[] = [];
    let resolveNext: (() => void) | null = null;

    const onCollect = (item: any) => {
      queue.push(item);
      if (resolveNext) {
        resolveNext();
        resolveNext = null;
      }
    };

    this.on('collect', onCollect);

    try {
      while (!this.ended || queue.length > 0) {
        if (queue.length === 0) {
          await new Promise<void>((r) => (resolveNext = r));
        }
        while (queue.length > 0) {
          yield queue.shift();
        }
      }
    } finally {
      this.off('collect', onCollect);
    }
  }
}

export class ComponentCollector extends BaseCollector {}
export class MessageCollector extends BaseCollector {}
export class ReactionCollector extends BaseCollector {}
export class ButtonCollector extends BaseCollector {}
export class SelectCollector extends BaseCollector {}
export class ModalCollector extends BaseCollector {}

export class CollectorManager {
  private activeCollectors = new Set<BaseCollector>();

  public createMessageCollector(options: CollectorOptions = {}): MessageCollector {
    const collector = new MessageCollector(options);
    this.activeCollectors.add(collector);
    collector.on('end', () => this.activeCollectors.delete(collector));
    return collector;
  }

  public createComponentCollector(options: CollectorOptions = {}): ComponentCollector {
    const collector = new ComponentCollector(options);
    this.activeCollectors.add(collector);
    collector.on('end', () => this.activeCollectors.delete(collector));
    return collector;
  }

  public async awaitButton(customId: string, timeout = 30000): Promise<any> {
    return this.awaitComponent(customId, timeout);
  }

  public async awaitModal(customId: string, timeout = 30000): Promise<any> {
    return this.awaitComponent(customId, timeout);
  }

  public async awaitSelect(customId: string, timeout = 30000): Promise<any> {
    return this.awaitComponent(customId, timeout);
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
