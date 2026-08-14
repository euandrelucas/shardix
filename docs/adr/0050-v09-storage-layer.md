# ADR-0050: Storage Layer Abstraction (`@shardix/storage`)

**Status**: Proposed  
**Date**: 2026-08-04  
**Deciders**: Shardix Core Team  
**Tags**: v0.9, storage, s3, r2, minio, fs

## Context

Discord bots frequently handle media assets, dynamic image generators (e.g., custom guild rank cards, ticket attachments), audio recordings, exported logs, and database backups. Previously, developers built direct integrations with local file systems or cloud storage providers within application controllers. This tight coupling made it difficult to switch storage providers (e.g., moving from local filesystem in development to S3 or Cloudflare R2 in production) and created inconsistent stream handling for large files.

Shardix v0.9 introduces `@shardix/storage`, a unified binary storage provider offering a driver-based interface across local filesystem, AWS S3, Cloudflare R2, and MinIO backends.

## Decision

We will create a new monorepo package `@shardix/storage` providing a standard `StorageProvider` and driver interface.

Core Features:
1. **Unified Storage API**: Standardized methods: `get(key)`, `put(key, data, options?)`, `delete(key)`, `list(prefix?)`, and `presign(key, ttlSeconds)`.
2. **Streaming Support**: Full support for Node.js `Readable` streams and Web Streams (`ReadableStream`) for memory-efficient handling of large file uploads and downloads.
3. **Pluggable Driver Architecture**:
   - `LocalDriver`: Local disk persistence using native `node:fs/promises` and `node:stream` (default zero-dependency driver).
   - `S3Driver`: AWS S3 integration utilizing `@aws-sdk/client-s3` (optional peer dependency).
   - `R2Driver`: Cloudflare R2 driver extending `S3Driver` with customized Cloudflare S3 endpoint signing parameters.
   - `MinIODriver`: MinIO object storage client driver for self-hosted enterprise deployments (optional peer dependency).
4. **Presigned URL Generation**: Generates temporary read/write URLs for direct client uploads/downloads without routing binary streams through the bot application server.

## Architecture

```
 +-----------------------------------------------------------------+
 |                    Shardix Application Services                 |
 |        StorageService.put('avatars/user123.png', buffer)        |
 +--------------------------------+--------------------------------+
                                  |
                                  v
 +-----------------------------------------------------------------+
 |                         StorageService                          |
 |            +---------------------------------------+            |
 |            |          StorageDriver Interface      |            |
 |            +---+------------------+-------------+--+            |
 +----------------|------------------|-------------|---------------+
                  |                  |             |
     +------------+                  |             +------------+
     |                               |                          |
     v                               v                          v
+-------------------+      +-------------------+      +-------------------+
|    LocalDriver    |      |  S3 / R2 Drivers  |      |   MinIODriver     |
| (node:fs/promises)|      | (@aws-sdk/client) |      |   (MinIO Client)  |
+-------------------+      +-------------------+      +-------------------+
```

### Driver Interface Contract

```typescript
import { Readable } from 'node:stream';

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface PutObjectOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageDriver {
  get(key: string): Promise<Buffer>;
  getStream(key: string): Promise<Readable>;
  put(key: string, data: Buffer | Readable | string, options?: PutObjectOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageObject[]>;
  presign(key: string, ttlSeconds: number): Promise<string>;
}
```

### Usage Example: Storage Provider Injection

```typescript
import { Injectable } from '@shardix/core';
import { StorageService } from '@shardix/storage';

@Injectable()
export class AssetService {
  constructor(private readonly storage: StorageService) {}

  async uploadGuildBanner(guildId: string, imageBuffer: Buffer): Promise<string> {
    const key = `guilds/${guildId}/banner.png`;
    
    await this.storage.put(key, imageBuffer, {
      contentType: 'image/png',
    });

    // Generate temporary 1-hour presigned download URL
    return await this.storage.presign(key, 3600);
  }
}
```

## Consequences

### Positive
- Code independence: Application code interacts solely with `StorageService`, enabling seamless driver swapping across environments.
- Memory efficiency: `getStream()` and `put()` streaming capabilities prevent high RAM spikes when handling large media files.
- Presigned URLs offload heavy bandwidth serving directly to object storage CDNs.

### Negative / Trade-offs
- Cloud storage drivers (`S3Driver`, `MinIODriver`) require installing optional peer dependencies (`@aws-sdk/client-s3`, `minio`).
- `LocalDriver` does not natively support presigned URLs; fallback HTTP route generation is required for local presigning.

## Implementation Notes

- Package located at `packages/storage` (`@shardix/storage`).
- Implements `ProviderContract` via `StorageProvider` for DI container registration.
- Dynamic imports are used when instantiating `S3Driver` and `MinIODriver` to prevent runtime errors when cloud packages are uninstalled.

## References
- [ADR-0008: Provider Architecture](0008-provider-architecture.md)
- [ADR-0012: Official Providers](0012-official-providers.md)
