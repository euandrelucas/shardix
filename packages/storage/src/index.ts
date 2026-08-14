import { ProviderContract } from '@shardix/common';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { Readable } from 'node:stream';

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  etag?: string;
  metadata?: Record<string, string>;
}

export interface PutOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  overwrite?: boolean;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  delimiter?: string;
}

export interface PresignOptions {
  ttlSeconds?: number;
  operation?: 'get' | 'put';
}

export interface StorageDriver {
  get(key: string): Promise<Buffer>;
  getStream(key: string): Promise<Readable>;
  put(key: string, data: Buffer | string | Readable, options?: PutOptions): Promise<StorageObject>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(options?: ListOptions): Promise<StorageObject[]>;
  presign(key: string, options?: PresignOptions): Promise<string>;
  stat(key: string): Promise<StorageObject | null>;
}

export class LocalDriver implements StorageDriver {
  private basePath: string;

  constructor(options: { basePath: string }) {
    this.basePath = options.basePath;
  }

  private resolvePath(key: string): string {
    return join(this.basePath, key);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolvePath(key));
  }

  async getStream(key: string): Promise<Readable> {
    const path = this.resolvePath(key);
    return createReadStream(path);
  }

  async put(key: string, data: Buffer | string | Readable, options?: PutOptions): Promise<StorageObject> {
    const path = this.resolvePath(key);
    await mkdir(dirname(path), { recursive: true });
    
    if (data instanceof Readable) {
      await new Promise<void>((resolve, reject) => {
        const stream = createWriteStream(path);
        data.pipe(stream);
        data.on('end', () => resolve());
        data.on('error', reject);
        stream.on('error', reject);
      });
    } else {
      await writeFile(path, data);
    }
    
    const fileStat = await stat(path);
    return {
      key,
      size: fileStat.size,
      lastModified: fileStat.mtime,
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      await unlink(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async list(options?: ListOptions): Promise<StorageObject[]> {
    const maxKeys = options?.maxKeys ?? 1000;
    const prefix = options?.prefix ?? '';
    const results: StorageObject[] = [];

    const walk = async (dir: string, relativeDir: string) => {
      if (results.length >= maxKeys) return;
      
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (results.length >= maxKeys) return;
        
        const entryKey = join(relativeDir, entry.name).replace(/\\/g, '/');
        
        if (prefix && !entryKey.startsWith(prefix) && !prefix.startsWith(entryKey)) {
          continue;
        }

        if (entry.isDirectory()) {
          await walk(join(dir, entry.name), entryKey);
        } else {
          if (!prefix || entryKey.startsWith(prefix)) {
            const fileStat = await stat(join(dir, entry.name));
            results.push({
              key: entryKey,
              size: fileStat.size,
              lastModified: fileStat.mtime,
            });
          }
        }
      }
    };

    await walk(this.basePath, '');
    return results;
  }

  async presign(key: string, options?: PresignOptions): Promise<string> {
    const ttlSeconds = options?.ttlSeconds ?? 3600;
    const absPath = this.resolvePath(key);
    const expires = Date.now() + ttlSeconds * 1000;
    return `file://${absPath}?expires=${expires}`;
  }

  async stat(key: string): Promise<StorageObject | null> {
    try {
      const fileStat = await stat(this.resolvePath(key));
      return {
        key,
        size: fileStat.size,
        lastModified: fileStat.mtime,
      };
    } catch {
      return null;
    }
  }
}

export class S3Driver implements StorageDriver {
  constructor(options: { bucket: string, region: string, accessKeyId?: string, secretAccessKey?: string, endpoint?: string }) {
    // S3 driver stub
  }

  private fail(): never {
    throw new Error('S3Driver requires @aws-sdk/client-s3: npm install @aws-sdk/client-s3');
  }

  async get(key: string): Promise<Buffer> { return this.fail(); }
  async getStream(key: string): Promise<Readable> { return this.fail(); }
  async put(key: string, data: Buffer | string | Readable, options?: PutOptions): Promise<StorageObject> { return this.fail(); }
  async delete(key: string): Promise<boolean> { return this.fail(); }
  async exists(key: string): Promise<boolean> { return this.fail(); }
  async list(options?: ListOptions): Promise<StorageObject[]> { return this.fail(); }
  async presign(key: string, options?: PresignOptions): Promise<string> { return this.fail(); }
  async stat(key: string): Promise<StorageObject | null> { return this.fail(); }
}

export class StorageService {
  private driver: StorageDriver;

  constructor(driver: StorageDriver) {
    this.driver = driver;
  }

  async get(key: string) { return this.driver.get(key); }
  async getStream(key: string) { return this.driver.getStream(key); }
  async put(key: string, data: Buffer | string | Readable, options?: PutOptions) { return this.driver.put(key, data, options); }
  async delete(key: string) { return this.driver.delete(key); }
  async exists(key: string) { return this.driver.exists(key); }
  async list(options?: ListOptions) { return this.driver.list(options); }
  async presign(key: string, options?: PresignOptions) { return this.driver.presign(key, options); }
  async stat(key: string) { return this.driver.stat(key); }

  async copy(srcKey: string, destKey: string): Promise<StorageObject> {
    const stream = await this.driver.getStream(srcKey);
    return this.driver.put(destKey, stream);
  }

  async move(srcKey: string, destKey: string): Promise<StorageObject> {
    const res = await this.copy(srcKey, destKey);
    await this.driver.delete(srcKey);
    return res;
  }
}

export interface StorageProviderOptions {
  driver: StorageDriver;
}

export class StorageProvider implements ProviderContract {
  public name = 'StorageProvider';
  public version = '0.9.0';
  private service: StorageService;
  private driver: StorageDriver;

  constructor(options: StorageProviderOptions) {
    this.driver = options.driver;
    this.service = new StorageService(this.driver);
  }

  async register(app: any): Promise<void> {
    app.singleton('StorageService', this.service);
    if (this.driver instanceof LocalDriver) {
      app.singleton('LocalDriver', this.driver);
    }
  }
}

export function createStorageProvider(options: StorageProviderOptions): StorageProvider {
  return new StorageProvider(options);
}

export function createLocalDriver(basePath: string): LocalDriver {
  return new LocalDriver({ basePath });
}
