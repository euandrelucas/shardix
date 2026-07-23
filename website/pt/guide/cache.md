# Camada de Cache, Provedores de Armazenamento e Sincronização

O Shardix possui um sistema corporativo de cache em múltiplas camadas (`ShardixCacheManager`) integrado automaticamente com eventos do Gateway e provedores de armazenamento.

---

## ⚡ Como Funciona o Cache no Shardix

1. **Sincronização Automática via Gateway**: A cada evento recebido (`GUILD_CREATE`, `MEMBER_UPDATE`, `ROLE_DELETE`), o `app.cache` atualiza as entidades em tempo real.
2. **Suporte Multi-Armazenamento**: Em memória (LRU/TTL) ou clusters Redis.
3. **Lazy Loading**: Se uma entidade não estiver em cache, o Shardix pode buscar via REST API e popular o cache de forma transparente.

---

## 🛠️ Exemplo de Uso

```typescript
import { ShardixFactory } from '@shardix/core';
import { MemoryCacheProvider, RedisCacheProvider } from '@shardix/provider-cache';

const app = await ShardixFactory.create();

// Registra o provedor de cache Redis
app.useProvider(new RedisCacheProvider('redis://localhost:6379'));

// Acessa entidades em cache diretamente
const guild = await app.cache.guild('123456789');
const member = await app.cache.member('123456789', '987654321');
```

---

## 📊 Entidades em Cache Suportadas

- `app.cache.guild(id)`
- `app.cache.channel(id)`
- `app.cache.user(id)`
- `app.cache.member(guildId, userId)`
- `app.cache.role(guildId, roleId)`
- `app.cache.emoji(guildId, emojiId)`
- `app.cache.sticker(guildId, stickerId)`
- `app.cache.thread(guildId, threadId)`
- `app.cache.voiceState(guildId, userId)`
