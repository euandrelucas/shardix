---
title: Sistema de Filas — Processamento em Background
description: Sistema corporativo de filas de tarefas em background para bots Shardix Discord com retentativas, prioridades, dead letter queues e suporte a BullMQ/Redis.
---

# 📬 Sistema de Filas

O `@shardix/provider-queue` fornece um sistema de filas de tarefas em segundo plano (background jobs) de nível corporativo para bots de Discord. Ele permite descarregar operações demoradas, pesadas ou sujeitas a rate-limits (como geração dinâmica de imagens, envio em massa de mensagens diretas, sincronização de banco de dados ou disparo de webhooks) para fora do loop principal de interações.

## Recursos

- ⚡ **Driver em Memória sem Dependências** (`MemoryDriver`) nativo para desenvolvimento rápido
- 🚀 **Driver Distribuído em Redis** (`RedisDriver`) via BullMQ para clusters de alta performance
- 🔄 **Retentativas e Backoff Automáticos** (estratégias fixa ou exponencial)
- 🪦 **Dead Letter Queue (DLQ)** para auditoria e recuperação de tarefas falhas sem perda de dados
- 🎯 **Decorators Declarativos**: `@QueueProcessor`, `@Process`, `@OnJobActive`, `@OnJobCompleted`, `@OnJobFailed`
- 📊 **Métricas em Tempo Real**: contagem de ativas, aguardando, concluídas, falhas e na DLQ
- 🧩 **Arquitetura DI Nativa**: injete `QueueService` em qualquer controller, service ou guard

---

## Instalação

```bash
npm install @shardix/provider-queue
```

Para clusters distribuídos baseados em Redis, instale as dependências opcionais:

```bash
npm install ioredis bullmq
```

---

## Configuração Rápida

Registre o `QueueProvider` ao inicializar seu bot Shardix:

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { QueueProvider } from '@shardix/provider-queue';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    new QueueProvider({
      driver: 'memory', // ou 'redis'
      redisUrl: process.env.REDIS_URL,
    }),
  ],
});
```

---

## Uso Básico

### Enviando Tarefas com `queue.add()`

Utilize `QueueService.add(queueName, jobName, data, options?)` para despachar tarefas em background:

```ts
import { Inject, Injectable } from '@shardix/common';
import { QueueService } from '@shardix/provider-queue';

@Injectable()
export class NotificationService {
  constructor(@Inject(QueueService) private queue: QueueService) {}

  async sendWelcomeNotice(userId: string, guildName: string) {
    const job = await this.queue.add('notifications', 'welcome-dm', {
      userId,
      guildName,
      createdAt: new Date(),
    });

    console.log(`Tarefa enviada com ID: ${job.id}`);
  }
}
```

### Processando Tarefas Programaticamente com `queue.process()`

```ts
import { QueueService, Job } from '@shardix/provider-queue';

queueService.process('notifications', async (job: Job<{ userId: string; guildName: string }>) => {
  console.log(`Processando tarefa ${job.id} para o usuário ${job.data.userId}`);
  // Lógica pesada executada aqui...
});
```

---

## Opções de Tarefa e Retentativas

Configure atraso, prioridade e tolerância a falhas:

```ts
await queueService.add(
  'reports',
  'generate-monthly-stats',
  { guildId: '123456789' },
  {
    // Atraso na execução em ms (ex: rodar após 5 segundos)
    delay: 5000,

    // Prioridade (números menores têm maior prioridade: 1 executa antes de 10)
    priority: 1,

    // Máximo de tentativas de retentativa em caso de erro
    attempts: 3,

    // Configuração de backoff entre retentativas
    backoff: {
      type: 'exponential', // 'fixed' | 'exponential'
      delay: 2000,         // atraso inicial em ms (2s -> 4s -> 8s)
    },

    // Timeout em milissegundos
    timeout: 30_000,

    // Remove do histórico ao concluir com sucesso para economizar memória
    removeOnComplete: true,
  }
);
```

| Opção | Tipo | Padrão | Descrição |
|---|---|---|---|
| `delay` | `number` | `0` | Tempo em milissegundos para aguardar antes da execução |
| `priority` | `number` | `0` | Prioridade de execução (menor número = maior prioridade) |
| `attempts` | `number` | `1` | Total de tentativas antes de mover para a Dead Letter Queue |
| `backoff` | `JobBackoffOptions` | `{ type: 'fixed', delay: 1000 }` | Estratégia de espera (`'fixed'` ou `'exponential'`) |
| `timeout` | `number` | `undefined` | Tempo limite em ms antes de estourar timeout |
| `removeOnComplete` | `boolean` | `false` | Se deve remover a tarefa após conclusão com sucesso |

---

## Dead Letter Queue (DLQ)

Quando uma tarefa falha e esgota todas as tentativas configuradas em `attempts`, ela não é descartada: é automaticamente movida para a **Dead Letter Queue (DLQ)**.

```ts
// Inspeciona tarefas retidas na DLQ
const deadJobs = await queueService.getDeadLetterJobs('notifications');

for (const deadJob of deadJobs) {
  console.error(`Tarefa na DLQ ${deadJob.id}: ${deadJob.failedReason}`);
  
  // Reenfileira após corrigir o problema raiz
  if (deadJob.canRetry) {
    await queueService.retryDeadLetterJob('notifications', deadJob.id);
  }
}
```

---

## Decorators Declarativos: `@QueueProcessor`

O Shardix fornece suporte nativo a decorators para estruturar classes consumidoras de fila:

```ts
import { Injectable } from '@shardix/common';
import {
  QueueProcessor,
  Process,
  OnJobActive,
  OnJobCompleted,
  OnJobFailed,
  Job,
} from '@shardix/provider-queue';

interface WelcomePayload {
  userId: string;
  guildId: string;
  username: string;
}

@QueueProcessor('welcome-system')
@Injectable()
export class WelcomeQueueProcessor {

  @Process('send-welcome-dm')
  async handleWelcomeDm(job: Job<WelcomePayload>) {
    const { userId, username, guildId } = job.data;
    
    console.log(`[Queue] Enviando mensagem de boas-vindas para @${username} (${userId})`);
    
    return { delivered: true, recipient: userId };
  }

  @OnJobActive()
  async onActive(job: Job) {
    console.log(`[Queue] Tarefa ${job.id} na fila "${job.queueName}" iniciou execução.`);
  }

  @OnJobCompleted()
  async onCompleted(job: Job, result: any) {
    console.log(`[Queue] Tarefa ${job.id} concluída com sucesso:`, result);
  }

  @OnJobFailed()
  async onFailed(job: Job, error: Error) {
    console.error(`[Queue] Tarefa ${job.id} falhou na tentativa ${job.attempts}: ${error.message}`);
  }
}
```

---

## Métricas e Monitoramento da Fila

Inspecione a saúde e vazão das suas filas programaticamente ou pelo Shardix Dashboard:

```ts
const stats = await queueService.getStats('welcome-system');

console.log(stats);
// Saída:
// {
//   queue: 'welcome-system',
//   waiting: 12,
//   active: 2,
//   completed: 1540,
//   failed: 3,
//   delayed: 5,
//   deadLetterCount: 1,
//   throughputPerMinute: 68
// }
```

---

## Exemplo Real em Bot Discord

### Cenário: Envio de DM Desacoplado após Slash Command

Comandos slash do Discord exigem resposta inicial em menos de 3 segundos. Enviar mensagens diretas para múltiplos membros ou renderizar imagens pesadas de forma síncrona arrisca estourar o timeout da interação.

Com o `@shardix/provider-queue`, responda imediatamente e processe em background com segurança.

```ts
// src/services/dm-queue.processor.ts
import { Inject, Injectable } from '@shardix/common';
import { QueueProcessor, Process, Job, OnJobFailed } from '@shardix/provider-queue';
import { DiscordClient } from '@shardix/core';

interface DirectMessageJobData {
  targetUserId: string;
  moderatorId: string;
  message: string;
}

@QueueProcessor('moderation-dm')
@Injectable()
export class ModerationDmProcessor {
  constructor(@Inject(DiscordClient) private client: any) {}

  @Process('send-warning-dm')
  async processWarningDm(job: Job<DirectMessageJobData>) {
    const { targetUserId, message } = job.data;
    
    const user = await this.client.users.fetch(targetUserId);
    if (!user) {
      throw new Error(`Usuário ${targetUserId} não encontrado`);
    }

    await user.send({
      content: `⚠️ **Aviso Oficial**: ${message}`,
    });

    return { delivered: true, timestamp: Date.now() };
  }

  @OnJobFailed()
  async onFailed(job: Job<DirectMessageJobData>, error: Error) {
    console.warn(`[ModDM] Falha ao enviar DM para ${job.data.targetUserId}: ${error.message}`);
  }
}
```

```ts
// src/controllers/warn.controller.ts
import { Controller, SlashCommand, Inject } from '@shardix/common';
import { QueueService } from '@shardix/provider-queue';
import type { CommandContext } from '@shardix/common';

@Controller()
export class ModerationController {
  constructor(@Inject(QueueService) private queue: QueueService) {}

  @SlashCommand({
    name: 'warn',
    description: 'Aplica advertência em um membro e envia notificação por DM',
  })
  async warnUser(ctx: CommandContext) {
    const targetUserId = ctx.getOption<string>('user');
    const reason = ctx.getOption<string>('reason') ?? 'Nenhum motivo informado';

    // 1. Responde ao Discord imediatamente (< 50ms)
    await ctx.reply({
      content: `✅ Usuário <@${targetUserId}> advertido. Notificação enviada para a fila.`,
      ephemeral: true,
    });

    // 2. Descarrega o envio para a fila em background com retentativas
    await this.queue.add(
      'moderation-dm',
      'send-warning-dm',
      {
        targetUserId,
        moderatorId: ctx.userId,
        message: reason,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1500 },
        removeOnComplete: true,
      }
    );
  }
}
```
