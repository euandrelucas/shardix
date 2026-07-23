import { ProviderContract } from '@shardix/common';
import { CacheService, CacheStore, MemoryCacheStore, RedisCacheStore } from '@shardix/cache';

export interface CacheProviderOptions {
  store?: CacheStore;
  redisUrl?: string;
}

export class CacheProvider implements ProviderContract {
  public readonly name = 'CacheProvider';
  public readonly version = '0.3.0';
  private cacheService: CacheService;

  constructor(options: CacheProviderOptions = {}) {
    let store: CacheStore;
    if (options.store) {
      store = options.store;
    } else if (options.redisUrl) {
      store = new RedisCacheStore(options.redisUrl);
    } else {
      store = new MemoryCacheStore();
    }
    this.cacheService = new CacheService(store);
  }

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: CacheService,
      useValue: this.cacheService,
    });
    container.register({
      provide: CacheProvider,
      useValue: this,
    });
  }

  public getCacheService(): CacheService {
    return this.cacheService;
  }
}
