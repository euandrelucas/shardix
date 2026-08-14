---
title: Camada de Storage — Local, S3, R2, MinIO
description: Abstração unificada de armazenamento binário e de arquivos para bots Shardix com suporte a Disco Local, AWS S3, Cloudflare R2 e MinIO com streaming e URLs pré-assinadas.
---

# 🗄️ Camada de Storage

O `@shardix/storage` fornece uma abstração corporativa e agnóstica de provedor para armazenamento e recuperação de arquivos, imagens dinâmicas geradas em canvas, áudios gravados, logs e backups. Ele permite que seu bot Discord trabalhe com o sistema de arquivos local durante o desenvolvimento e migre perfeitamente para AWS S3, Cloudflare R2 ou MinIO em produção sem alterar o código da aplicação.

## Principais Recursos

- 🔌 **Arquitetura Multi-Driver**: `LocalDriver`, `S3Driver`, `R2Driver`, `MinIODriver`
- ⚡ **Driver Local sem Dependências Externas**: Utiliza `node:fs/promises` e `node:stream` nativos
- 🌊 **Streaming Eficiente em Memória**: Suporte total a `Readable` streams do Node.js
- 🔗 **Geração de URLs Pré-assinadas (Presigned URLs)**: Descarrega downloads e uploads pesados diretamente para a CDN do S3/R2
- 📁 **Operações Completas de Arquivo**: `get`, `put`, `delete`, `exists`, `list`, `stat`, `copy`, `move`
- 🧩 **Injeção de Dependência Nativa**: Injete `StorageService` em qualquer ponto da aplicação

---

## Instalação

```bash
npm install @shardix/storage
```

Para drivers de armazenamento em nuvem (S3, Cloudflare R2, MinIO), instale o SDK opcional:

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Configuração e Drivers

Registre o `StorageProvider` na inicialização da sua aplicação:

### 1. Driver Local (Desenvolvimento / Padrão)

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

### 2. Driver AWS S3 (Produção)

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

### 3. Compatibilidade com Cloudflare R2 e MinIO

Tanto o Cloudflare R2 quanto o MinIO utilizam a API compatível com S3. Basta configurar o `endpoint` correspondente:

```ts
// Configuração do Cloudflare R2
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

// Configuração do MinIO Self-Hosted
const minioStorage = new StorageProvider({
  driver: new S3Driver({
    endpoint: 'http://localhost:9000',
    bucket: 'discord-bot',
    region: 'us-east-1',
    s3ForcePathStyle: true, // Obrigatório para MinIO
    credentials: {
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
    },
  }),
});
```

---

## Referência de Métodos

Todas as operações são realizadas por meio do `StorageService`:

### `put(key, data, options?)`

Salva um arquivo (aceita `Buffer`, `string`, `Uint8Array` ou `Readable` stream):

```ts
await storage.put('avatars/user-123.png', buffer, {
  contentType: 'image/png',
  metadata: { uploadedBy: 'bot-admin' },
});
```

### `get(key)`

Recupera o conteúdo do arquivo como um `Buffer`:

```ts
const fileBuffer = await storage.get('avatars/user-123.png');
```

### `getStream(key)`

Transmite o arquivo via stream, economizando memória em arquivos grandes:

```ts
import { createWriteStream } from 'node:fs';

const stream = await storage.getStream('backups/db-export.tar.gz');
stream.pipe(createWriteStream('./restored.tar.gz'));
```

### `exists(key)`

Verifica a existência de um objeto:

```ts
const exists = await storage.exists('guilds/999/banner.jpg');
```

### `stat(key)`

Retorna metadados e tamanho sem baixar o arquivo:

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

Exclui um objeto:

```ts
await storage.delete('temp/scratch-card.png');
```

### `list(prefix?)`

Lista arquivos salvos com um prefixo de pasta opcional:

```ts
const files = await storage.list('guilds/123456789/');

for (const file of files) {
  console.log(`- ${file.key} (${file.size} bytes)`);
}
```

### `copy(srcKey, destKey)` e `move(srcKey, destKey)`

Duplica ou move arquivos:

```ts
// Copiar arquivo
await storage.copy('templates/default-card.png', 'guilds/123/card.png');

// Mover ou renomear arquivo
await storage.move('temp/upload-999.png', 'avatars/user-999.png');
```

### `presign(key, ttlSeconds)`

Gera uma URL pré-assinada temporária para download direto sem consumir banda do servidor do bot:

```ts
// URL válida por 30 minutos (1800s)
const downloadUrl = await storage.presign('reports/monthly-summary.pdf', 1800);

await ctx.reply({
  content: `Seu relatório está pronto: [Clique aqui para baixar](${downloadUrl})`,
});
```

---

## Injeção de Dependência (DI)

Injete `StorageService` em qualquer classe `@Injectable()` ou `@Controller()`:

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

## Exemplo Real em Bot Discord

### Salvar Ícone do Servidor e Gerar Link Temporário de Alta Velocidade

```ts
import { Controller, SlashCommand, Inject } from '@shardix/common';
import { StorageService } from '@shardix/storage';
import type { CommandContext } from '@shardix/common';

@Controller()
export class GuildAssetController {
  constructor(@Inject(StorageService) private storage: StorageService) {}

  @SlashCommand({
    name: 'salvar-icone',
    description: 'Salva o ícone do servidor no storage e gera link de download',
  })
  async saveIcon(ctx: CommandContext) {
    await ctx.deferReply();

    const iconUrl = ctx.guild?.iconURL({ size: 1024, extension: 'png' });
    if (!iconUrl) {
      return ctx.editReply('Este servidor não possui um ícone configurado.');
    }

    // 1. Baixa o ícone do CDN do Discord
    const response = await fetch(iconUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Salva no storage (Local, S3 ou R2)
    const storageKey = `guilds/${ctx.guildId}/icon-${Date.now()}.png`;
    await this.storage.put(storageKey, buffer, {
      contentType: 'image/png',
    });

    // 3. Gera URL pré-assinada válida por 2 horas
    const presignedUrl = await this.storage.presign(storageKey, 7200);

    return ctx.editReply({
      content: `✅ Ícone do servidor salvo com sucesso!\n🔗 Link de acesso: ${presignedUrl}`,
    });
  }
}
```
