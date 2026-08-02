import { ProviderContract } from '@shardix/common';
import { CacheService, CacheStore, MemoryCacheStore, RedisCacheStore } from '@shardix/cache';

export interface CacheProviderOptions {
  store?: CacheStore;
  redisUrl?: string;
  /** TTL in seconds applied globally to all cache entries */
  ttl?: number;
  /** Maximum number of entries for LRU cache (LRUCacheProvider only) */
  maxSize?: number;
}

/** Simple LRU (Least Recently Used) cache store using a Map with insertion-order eviction */
export class LRUCacheStore implements CacheStore {
  private store = new Map<string, { value: unknown; expiresAt?: number }>();
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  public async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Move to end (most recently used)
    this.store.delete(key);
    this.store.set(key, item);
    return item.value as T;
  }

  public async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    // Evict least recently used (first entry) if at capacity
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  public size(): number {
    return this.store.size;
  }
}

export class MemoryCacheProvider implements ProviderContract {
  public readonly name = 'MemoryCacheProvider';
  public readonly version = '0.8.1';
  public readonly cacheService: CacheService;
  private readonly ttl?: number;

  constructor(options: CacheProviderOptions = {}) {
    this.ttl = options.ttl;
    this.cacheService = new CacheService(options.store || new MemoryCacheStore());
  }

  public async register(app: { getContainer(): { register(p: unknown): void } }): Promise<void> {
    app.getContainer().register({ provide: MemoryCacheProvider, useValue: this });
    app.getContainer().register({ provide: CacheService, useValue: this.cacheService });
  }
}

/**
 * LRU Cache Provider — uses a true Least Recently Used eviction policy.
 * Evicts the least-recently-accessed key when `maxSize` is exceeded.
 */
export class LRUCacheProvider implements ProviderContract {
  public readonly name = 'LRUCacheProvider';
  public readonly version = '0.8.1';
  public readonly cacheService: CacheService;
  private readonly store: LRUCacheStore;

  constructor(options: CacheProviderOptions = {}) {
    this.store = new LRUCacheStore(options.maxSize || 1000);
    this.cacheService = new CacheService(this.store);
  }

  public async register(app: { getContainer(): { register(p: unknown): void } }): Promise<void> {
    app.getContainer().register({ provide: LRUCacheProvider, useValue: this });
    app.getContainer().register({ provide: CacheService, useValue: this.cacheService });
  }

  /** Get current cache size */
  public size(): number {
    return this.store.size();
  }
}

export class RedisCacheProvider implements ProviderContract {
  public readonly name = 'RedisCacheProvider';
  public readonly version = '0.8.1';
  public readonly cacheService: CacheService;

  constructor(redisUrl = 'redis://localhost:6379') {
    this.cacheService = new CacheService(new RedisCacheStore(redisUrl));
  }

  public async register(app: { getContainer(): { register(p: unknown): void } }): Promise<void> {
    app.getContainer().register({ provide: RedisCacheProvider, useValue: this });
    app.getContainer().register({ provide: CacheService, useValue: this.cacheService });
  }
}

export class CacheProvider implements ProviderContract {
  public readonly name = 'CacheProvider';
  public readonly version = '0.8.1';
  private cacheService: CacheService;
  private readonly defaultTtl?: number;

  constructor(options: CacheProviderOptions = {}) {
    this.defaultTtl = options.ttl;
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

  public async register(app: { getContainer(): { register(p: unknown): void } }): Promise<void> {
    const container = app.getContainer();
    container.register({ provide: CacheService, useValue: this.cacheService });
    container.register({ provide: CacheProvider, useValue: this });
  }

  public getCacheService(): CacheService {
    return this.cacheService;
  }
}
