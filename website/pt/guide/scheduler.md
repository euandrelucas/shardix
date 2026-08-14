---
title: Scheduler — @Cron, @Interval, @Timeout
description: Agende tarefas recorrentes e cron jobs diretamente no seu bot do Discord usando o scheduler baseado em decorators do Shardix.
---

# ⏰ Scheduler

O `@shardix/scheduler` oferece um sistema de agendamento orientado a decorators que permite definir tarefas recorrentes, intervalos periódicos e timeouts únicos diretamente em suas classes de serviço — sem a necessidade de um daemon externo ou runner de cron separado.

## Instalação

```bash
npm install @shardix/scheduler
```

## Configuração

Registre o `SchedulerProvider` ao criar sua aplicação:

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { SchedulerProvider } from '@shardix/scheduler';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [new SchedulerProvider()],
});
```

---

## Decorators

### `@Cron(expression, options?)`

Executa o método decorado com base em uma expressão cron padrão de 5 campos.

```ts
import { Injectable } from '@shardix/common';
import { Cron } from '@shardix/scheduler';

@Injectable()
export class MaintenanceService {
  // Todo dia à meia-noite
  @Cron('0 0 * * *')
  async purgeExpiredData() {
    await database.purgeExpired();
  }

  // Toda segunda-feira às 9h da manhã
  @Cron('0 9 * * 1', { name: 'weekly-report', runOnInit: false })
  async sendWeeklyReport() {
    await reports.sendSummary();
  }

  // A cada 15 minutos
  @Cron('*/15 * * * *')
  async syncCache() {
    await cache.sync();
  }
}
```

**Formato da expressão cron:**
```
┌───────── minuto (0-59)
│ ┌───────── hora (0-23)
│ │ ┌───────── dia do mês (1-31)
│ │ │ ┌───────── mês (1-12)
│ │ │ │ ┌───────── dia da semana (0-7, 0 e 7 são Domingo)
│ │ │ │ │
* * * * *
```

**Padrões suportados:** `*`, `1-5` (intervalos), `1,3,5` (listas), `*/15` (passos/steps)

| Opção | Tipo | Padrão | Descrição |
|-------|------|---------|-------------|
| `name` | `string` | nome do método | Nome da tarefa para busca no registro |
| `timeZone` | `string` | sistema | Ex: `'America/Sao_Paulo'` |
| `runOnInit` | `boolean` | `false` | Executa imediatamente ao iniciar o bot |
| `disabled` | `boolean` | `false` | Registra, mas não inicia automaticamente |

---

### `@Interval(ms, options?)`

Repete a execução do método a cada N milissegundos.

```ts
@Injectable()
export class StatusService {
  // Verifica a cada 30 segundos
  @Interval(30_000, { name: 'heartbeat' })
  async sendHeartbeat() {
    await statusPage.ping();
  }

  // Sincroniza o placar a cada 5 minutos
  @Interval(5 * 60 * 1000)
  async syncLeaderboard() {
    await leaderboard.refresh();
  }
}
```

---

### `@Timeout(ms, options?)`

Executa o método exatamente uma vez após N milissegundos a partir da inicialização.

```ts
@Injectable()
export class BotStartupService {
  // Anuncia status online 5 segundos após a inicialização
  @Timeout(5_000, { name: 'startup-announce' })
  async announceOnline() {
    await announceChannel.send('Bot está online! 🚀');
  }

  // Pré-aquece o cache 2 segundos após o boot
  @Timeout(2_000)
  async prewarmCache() {
    await cache.preload();
  }
}
```

---

## SchedulerRegistry

Acesse e controle tarefas em execução programaticamente:

```ts
import { Inject, Injectable } from '@shardix/common';
import { SchedulerRegistry } from '@shardix/scheduler';

@Injectable()
export class AdminService {
  constructor(@Inject(SchedulerRegistry) private scheduler: SchedulerRegistry) {}

  // Pausa uma tarefa
  async pauseHeartbeat() {
    this.scheduler.stop('heartbeat');
  }

  // Retoma uma tarefa
  async resumeHeartbeat() {
    this.scheduler.start('heartbeat');
  }

  // Obtém estatísticas
  getStats() {
    return this.scheduler.getStats();
    // { totalJobs: 4, runningJobs: 3, stoppedJobs: 1, totalExecutions: 1240, totalErrors: 0 }
  }

  // Inspeciona uma tarefa específica
  getJobInfo() {
    const job = this.scheduler.get('weekly-report');
    // { name, type, status, lastRun, nextRun, runCount, errorCount }
    return job;
  }
}
```

---

## Exemplo Completo

```ts
import { Injectable, Controller, SlashCommand, Inject } from '@shardix/common';
import { Cron, Interval, Timeout, SchedulerRegistry } from '@shardix/scheduler';
import type { CommandContext } from '@shardix/common';

@Injectable()
export class GameService {
  private scores = new Map<string, number>();

  @Cron('0 0 * * 0', { name: 'reset-weekly' }) // Todo domingo à meia-noite
  async resetWeeklyScores() {
    this.scores.clear();
    console.log('[Scheduler] Pontuações semanais resetadas');
  }

  @Interval(60_000) // A cada minuto
  async broadcastTopPlayers() {
    const top = [...this.scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    console.log('[Scheduler] Top 3:', top);
  }

  @Timeout(3_000) // 3 segundos após a inicialização
  async announceSeasonStart() {
    console.log('[Scheduler] Nova temporada iniciada!');
  }

  addScore(userId: string, points: number) {
    this.scores.set(userId, (this.scores.get(userId) ?? 0) + points);
  }
}

@Controller()
export class GameController {
  constructor(@Inject(GameService) private game: GameService) {}

  @SlashCommand({ name: 'score', description: 'Adicionar pontos' })
  async score(ctx: CommandContext) {
    this.game.addScore(ctx.userId, 10);
    return ctx.reply({ content: '+10 pontos!' });
  }
}
```

---

## Encerramento Gracioso (Graceful Shutdown)

O `SchedulerProvider` registra automaticamente hooks de encerramento do ciclo de vida. Quando `app.stop()` é chamado:
1. Nenhuma nova execução de tarefa é iniciada.
2. Tarefas em execução têm permissão para finalizar (tempo limite de até 30s).
3. Todos os timers e agendadores são limpos da memória.

---

## Uso Standalone (Sem o Framework)

```ts
import { SchedulerService, SchedulerRegistry } from '@shardix/scheduler';

const registry = new SchedulerRegistry();
const scheduler = new SchedulerService(registry);

scheduler.scheduleJob({
  name: 'my-task',
  type: 'interval',
  intervalMs: 5000,
  handler: async () => console.log('tick'),
  options: {},
  runCount: 0,
  errorCount: 0,
  status: 'idle',
});
```
