---
title: Event Bus & Eventos Distribuídos
description: Barramento desacoplado de eventos pub/sub em processo e distribuído via Redis com suporte a padrões curinga (wildcards), IDs de correlação e injeção de dependência.
---

# 📡 Event Bus & Eventos Distribuídos

O `@shardix/provider-eventbus` (trabalhando em conjunto com o `@shardix/events`) oferece um barramento de comunicação assíncrona tipado no padrão publish-subscribe para aplicações Shardix. Ele permite que diferentes serviços, módulos e nós de cluster reajam a eventos de domínio sem criar acoplamento direto de código.

## Principais Recursos

- 🎯 **Pub/Sub em Memória e Distribuído**: Publique localmente no mesmo processo ou entre nós de cluster via Redis.
- 🔁 **Proteção contra Loopback**: Identificadores de nó (`nodeId`) automáticos evitam que a instância de origem processe eventos repetidos.
- 🔍 **Inscrições com Padrões Curinga (Wildcards)**: Escute todos os eventos (`*`) ou namespaces inteiros (`user.*`, `guild.member.*`).
- 🏷️ **Metadados Ricos de Eventos**: Cada evento transporta `eventId`, `correlationId`, `timestamp` e o nó emissor.
- 🧩 **Integração Nativa com DI**: Injete `EventBus` em qualquer controller, service ou provider.

---

## Instalação

```bash
npm install @shardix/provider-eventbus @shardix/events
```

Para comunicação distribuída entre múltiplos processos/shards, instale o `ioredis`:

```bash
npm install ioredis
```

---

## Configuração do Provider

Registre o `EventBusProvider` ao criar a aplicação:

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { EventBusProvider } from '@shardix/provider-eventbus';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    new EventBusProvider({
      // Opcional: configure a URL do Redis para habilitar eventos entre shards
      redisUrl: process.env.REDIS_URL,
    }),
  ],
});
```

---

## API Principal

O `EventBus` disponibiliza os métodos essenciais de pub/sub:

### `on(event, handler)`

Registra um listener persistente que executa toda vez que o evento é emitido.

```ts
eventBus.on('user.registered', async (payload) => {
  console.log('Novo usuário registrado:', payload);
});
```

### `once(event, handler)`

Registra um listener que executa apenas uma vez e se desinscreve automaticamente.

```ts
eventBus.once('system.ready', async () => {
  console.log('Sistema inicializado com sucesso!');
});
```

### `off(event, handler)`

Remove um listener previamente registrado.

```ts
const handler = (data: any) => console.log(data);
eventBus.on('tick', handler);

// Cancela a inscrição
eventBus.off('tick', handler);
```

### `emit(event, payload)`

Publica um evento para todos os ouvintes locais e transmite para o canal Redis distribuído, se configurado.

```ts
await eventBus.emit('guild.joined', {
  guildId: '123456789',
  guildName: 'Developers Hub',
  memberCount: 250,
});
```

---

## Inscrições por Padrão e Curinga (Wildcard)

O EventBus suporta correspondência por padrões hierárquicos:

### 1. Curinga Global (`*`)
Captura todos os eventos de toda a aplicação:

```ts
eventBus.on('*', (event, payload) => {
  console.log(`[Auditoria Global] Evento disparado "${event}":`, payload);
});
```

### 2. Padrões por Namespace (`user.*`, `guild.*`)
Captura todos os subeventos dentro de uma categoria específica:

```ts
// Escuta user.created, user.updated, user.deleted, user.warned, etc.
eventBus.on('user.*', (payload) => {
  console.log('Evento do ciclo de vida de usuário disparado:', payload);
});
```

---

## Metadados e Envelopes de Evento

Os eventos distribuídos são encapsulados em envelopes padronizados com suporte a rastreamento distribuído:

```ts
export interface EventEnvelope<T = unknown> {
  /** UUID v4 único identificando a emissão do evento */
  eventId: string;
  /** ID de correlação para rastreamento entre serviços */
  correlationId?: string;
  /** Timestamp ISO-8601 UTC */
  timestamp: string;
  /** ID do nó ou worker de origem */
  nodeId: string;
  /** Dados úteis (payload) */
  payload: T;
}
```

---

## Arquitetura de Eventos Distribuídos (Redis)

Quando `redisUrl` é fornecido ao `EventBusProvider`:
1. Cada chamada a `emit('nome.evento', payload)` executa os listeners locais primeiro.
2. O payload é publicado no Redis pub/sub no canal `shardix:events:nome.evento` contendo o `nodeId`.
3. Outros nós do bot que estão inscritos em `shardix:events:*` recebem a mensagem.
4. O `nodeId` é inspecionado para descartar mensagens enviadas pelo próprio nó, evitando execução dupla em loopback.

```
       [ Nó do Cluster 1 ]                     [ Nó do Cluster 2 ]
    +-----------------------+              +-----------------------+
    | emit('user.banned')   |              | on('user.banned')     |
    |  -> Listeners locais  |              |  -> Listener remoto   |
    +-----------+-----------+              +-----------^-----------+
                |                                      |
                |   PUBLISH (shardix:events:...)       |  PSUBSCRIBE
                +-----------------> [ Redis ] ---------+
```

---

## Padrão de Injeção de Dependência (DI)

Injete `EventBus` diretamente em qualquer classe `@Injectable()` ou `@Controller()`:

```ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';

@Injectable()
export class AuditLogService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {
    this.setupListeners();
  }

  private setupListeners() {
    this.eventBus.on('moderation.*', async (eventData) => {
      await this.saveAuditLogEntry(eventData);
    });
  }

  private async saveAuditLogEntry(entry: unknown) {
    console.log('[Auditoria] Gravado:', entry);
  }
}
```

---

## Exemplo Real em Bot Discord: Comunicação Entre Serviços

### Cenário: Advertência de Moderação Aciona Vários Sistemas Independentes

Quando um moderador executa `/warn`:
1. `ModerationService` salva a advertência no banco e emite `moderation.user_warned`.
2. `AuditLogService` escuta `moderation.*` e envia um embed no canal `#logs-moderacao`.
3. `LevelingService` escuta `moderation.user_warned` e subtrai XP do membro.
4. `DmNotificationService` notifica o usuário no privado.

Todos os serviços permanecem 100% desacoplados entre si!

```ts
// src/events/moderation.events.ts
export interface UserWarnedEvent {
  guildId: string;
  userId: string;
  moderatorId: string;
  reason: string;
  warnCount: number;
}
```

```ts
// src/services/moderation.service.ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';
import type { UserWarnedEvent } from '../events/moderation.events';

@Injectable()
export class ModerationService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {}

  async warnUser(guildId: string, userId: string, moderatorId: string, reason: string) {
    // 1. Salva advertência no banco de dados
    const warnCount = 3;

    // 2. Emite evento de domínio
    await this.eventBus.emit('moderation.user_warned', {
      guildId,
      userId,
      moderatorId,
      reason,
      warnCount,
    } satisfies UserWarnedEvent);

    return warnCount;
  }
}
```

```ts
// src/services/leveling.service.ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';
import type { UserWarnedEvent } from '../events/moderation.events';

@Injectable()
export class LevelingService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {
    this.eventBus.on('moderation.user_warned', (payload) => {
      this.deductXp(payload as UserWarnedEvent);
    });
  }

  private async deductXp(event: UserWarnedEvent) {
    console.log(`[Leveling] Penalizando usuário ${event.userId} em -50 XP devido à advertência.`);
  }
}
```

```ts
// src/services/audit-log.service.ts
import { Inject, Injectable } from '@shardix/common';
import { EventBus } from '@shardix/events';

@Injectable()
export class AuditLogService {
  constructor(@Inject(EventBus) private eventBus: EventBus) {
    // Padrão curinga captura qualquer ação de moderação
    this.eventBus.on('moderation.*', (data) => {
      this.writeLog(data);
    });
  }

  private async writeLog(data: unknown) {
    console.log('[Canal de Logs] Ação registrada:', data);
  }
}
```
