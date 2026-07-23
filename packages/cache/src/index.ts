import { Injectable, Scope } from '@shardix/common';
import Redis from 'ioredis';

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

export class MemoryCacheStore implements CacheStore {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  public async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value as T;
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

export class RedisCacheStore implements CacheStore {
  private redis: Redis;

  constructor(redisUrlOrClient: string | Redis) {
    if (typeof redisUrlOrClient === 'string') {
      this.redis = new Redis(redisUrlOrClient);
    } else {
      this.redis = redisUrlOrClient;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const str = JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, str);
    } else {
      await this.redis.set(key, str);
    }
  }

  public async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

@Injectable({ scope: Scope.SINGLETON })
export class CacheService {
  private store: CacheStore;

  constructor(store?: CacheStore) {
    this.store = store || new MemoryCacheStore();
  }

  public setStore(store: CacheStore): void {
    this.store = store;
  }

  public get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(key);
  }

  public set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    return this.store.set(key, value, ttlSeconds);
  }

  public del(key: string): Promise<void> {
    return this.store.del(key);
  }
}
