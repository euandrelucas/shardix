---
title: Storage Layer — Local, S3, R2, MinIO
description: Unified binary and file storage abstraction for Shardix Discord bots supporting Local Disk, AWS S3, Cloudflare R2, and MinIO with streaming and presigned URLs.
---

# 🗄️ Storage Layer

`@shardix/storage` provides an enterprise-ready, driver-agnostic abstraction for storing and retrieving files, dynamic canvas images, voice recordings, logs, and backups. It enables your Discord bot to work with local filesystem storage during development and seamlessly switch to AWS S3, Cloudflare R2, or MinIO in production without altering application code.

## Key Features

- 🔌 **Pluggable Multi-Driver Architecture**: `LocalDriver`, `S3Driver`, `R2Driver`, `MinIODriver`
- ⚡ **Zero-dependency Local Driver**: Uses Node.js native `fs/promises` and `node:stream`
- 🌊 **Memory-efficient Streaming**: Native support for Node.js `Readable` streams and `ReadableStream`
- 🔗 **Presigned URL Generation**: Offload heavy asset downloads/uploads directly to S3/R2 CDNs
- 📁 **File Operations**: `get`, `put`, `delete`, `exists`, `list`, `stat`, `copy`, `move`
- 🧩 **DI-first**: Seamlessly inject `StorageService` anywhere in your application

---

## Installation

```bash
npm install @shardix/storage
```

For cloud object storage drivers (S3, Cloudflare R2, MinIO), install the optional client SDK:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Setup & Configuration

Register `StorageProvider` in your application configuration:

### 1. Local Driver (Development / Default)

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { StorageProvider, LocalDriver } from '@shardix/storage';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    new StorageProvider({
      driver: new LocalDriver({
        baseDir: './storage/uploads',
      }),
    }),
  ],
});
```

### 2. S3 Driver (AWS S3)

```ts
import { StorageProvider, S3Driver } from '@shardix/storage';

const storageProvider = new StorageProvider({
  driver: new S3Driver({
    bucket: process.env.S3_BUCKET_NAME!,
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  }),
});
```

### 3. Cloudflare R2 & MinIO Compatibility

Both Cloudflare R2 and MinIO use S3-compatible APIs. Simply supply their respective `endpoint` and configuration parameters:

```ts
// Cloudflare R2 Configuration
const r2Storage = new StorageProvider({
  driver: new S3Driver({
    endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: 'bot-assets',
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  }),
});

// Self-hosted MinIO Configuration
const minioStorage = new StorageProvider({
  driver: new S3Driver({
    endpoint: 'http://localhost:9000',
    bucket: 'discord-bot',
    region: 'us-east-1',
    s3ForcePathStyle: true, // Required for MinIO
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
    },
  }),
});
```

---

## Storage Methods Reference

All operations are executed through the `StorageService`:

### `put(key, data, options?)`

Stores data (accepts `Buffer`, `string`, `Uint8Array`, or `Readable` stream):

```ts
await storage.put('avatars/user-123.png', buffer, {
  contentType: 'image/png',
  metadata: { uploadedBy: 'bot-admin' },
});
```

### `get(key)`

Retrieves file content as a `Buffer`:

```ts
const fileBuffer = await storage.get('avatars/user-123.png');
```

### `getStream(key)`

Streams the file directly, saving memory for large files:

```ts
import { createWriteStream } from 'node:fs';

const stream = await storage.getStream('backups/db-export.tar.gz');
stream.pipe(createWriteStream('./restored.tar.gz'));
```

### `exists(key)`

Checks whether an object exists in storage:

```ts
const exists = await storage.exists('guilds/999/banner.jpg');
if (!exists) {
  console.log('Banner does not exist');
}
```

### `stat(key)`

Retrieves metadata and size without downloading the entire payload:

```ts
const metadata = await storage.stat('assets/intro.mp4');
console.log(metadata);
// {
//   key: 'assets/intro.mp4',
//   size: 14502800,
//   lastModified: 2026-08-04T12:00:00.000Z,
//   contentType: 'video/mp4'
// }
```

### `delete(key)`

Deletes an object:

```ts
await storage.delete('temp/scratch-card.png');
```

### `list(prefix?)`

Lists stored objects matching an optional directory prefix:

```ts
const files = await storage.list('guilds/123456789/');

for (const file of files) {
  console.log(`- ${file.key} (${file.size} bytes)`);
}
```

### `copy(srcKey, destKey)` and `move(srcKey, destKey)`

Duplicating or moving files:

```ts
// Copy file
await storage.copy('templates/default-card.png', 'guilds/123/card.png');

// Move/rename file
await storage.move('temp/upload-999.png', 'avatars/user-999.png');
```

### `presign(key, ttlSeconds)`

Generates a temporary signed URL allowing clients or Discord embeds to download the object directly without consuming bot server bandwidth:

```ts
// URL valid for 30 minutes (1800s)
const downloadUrl = await storage.presign('reports/monthly-summary.pdf', 1800);

await ctx.reply({
  content: `Your report is ready for download: [Click here](${downloadUrl})`,
});
```

---

## Dependency Injection (DI)

Inject `StorageService` into any `@Injectable()` service or `@Controller()`:

```ts
import { Inject, Injectable } from '@shardix/common';
import { StorageService } from '@shardix/storage';

@Injectable()
export class BackupService {
  constructor(@Inject(StorageService) private storage: StorageService) {}

  async archiveGuild(guildId: string, data: object) {
    const json = JSON.stringify(data, null, 2);
    const key = `guilds/${guildId}/backup-${Date.now()}.json`;

    await this.storage.put(key, json, {
      contentType: 'application/json',
    });

    return key;
  }
}
```

---

## Real-World Bot Example

### Saving User Custom Avatars & Generating Shareable Icon Links

```ts
import { Controller, SlashCommand, Inject } from '@shardix/common';
import { StorageService } from '@shardix/storage';
import type { CommandContext } from '@shardix/common';

@Controller()
export class GuildAssetController {
  constructor(@Inject(StorageService) private storage: StorageService) {}

  @SlashCommand({
    name: 'save-icon',
    description: 'Archive server icon and generate a high-speed CDN sharing link',
  })
  async saveIcon(ctx: CommandContext) {
    await ctx.deferReply();

    const iconUrl = ctx.guild?.iconURL({ size: 1024, extension: 'png' });
    if (!iconUrl) {
      return ctx.editReply('This server does not have an icon.');
    }

    // 1. Download icon stream from Discord CDN
    const response = await fetch(iconUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Persist to storage backend (Local, S3, or R2)
    const storageKey = `guilds/${ctx.guildId}/icon-${Date.now()}.png`;
    await this.storage.put(storageKey, buffer, {
      contentType: 'image/png',
    });

    // 3. Generate a 2-hour presigned shareable URL
    const presignedUrl = await this.storage.presign(storageKey, 7200);

    return ctx.editReply({
      content: `✅ Server icon archived successfully!\n🔗 Temporary access link: ${presignedUrl}`,
    });
  }
}
```
