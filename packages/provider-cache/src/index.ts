import { ProviderContract } from '@shardix/common';
import { CacheService, CacheStore, MemoryCacheStore, RedisCacheStore } from '@shardix/cache';

export interface CacheProviderOptions {
  store?: CacheStore;
  redisUrl?: string;
  ttl?: number;
}

export class MemoryCacheProvider implements ProviderContract {
  public readonly name = 'MemoryCacheProvider';
  public readonly version = '0.8.0';
  public readonly cacheService: CacheService;

  constructor(options: CacheProviderOptions = {}) {
    this.cacheService = new CacheService(options.store || new MemoryCacheStore());
  }

  public async register(app: any): Promise<void> {
    app.getContainer().register({ provide: MemoryCacheProvider, useValue: this });
  }
}

export class LRUCacheProvider implements ProviderContract {
  public readonly name = 'LRUCacheProvider';
  public readonly version = '0.8.0';
  public readonly cacheService: CacheService;

  constructor(options: CacheProviderOptions = {}) {
    this.cacheService = new CacheService(options.store || new MemoryCacheStore());
  }

  public async register(app: any): Promise<void> {
    app.getContainer().register({ provide: LRUCacheProvider, useValue: this });
  }
}

export class RedisCacheProvider implements ProviderContract {
  public readonly name = 'RedisCacheProvider';
  public readonly version = '0.8.0';
  public readonly cacheService: CacheService;

  constructor(redisUrl = 'redis://localhost:6379') {
    this.cacheService = new CacheService(new RedisCacheStore(redisUrl));
  }

  public async register(app: any): Promise<void> {
    app.getContainer().register({ provide: RedisCacheProvider, useValue: this });
  }
}

export class CacheProvider implements ProviderContract {
  public readonly name = 'CacheProvider';
  public readonly version = '0.8.0';
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
