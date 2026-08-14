---
title: Observabilidade & Métricas em Tempo Real
description: Métricas de sistema em tempo real, logs estruturados, rastreamento de requisições e streaming de métricas via WebSocket para bots Shardix em produção.
---

# 📊 Observabilidade & Métricas em Tempo Real

O `@shardix/provider-observability` fornece uma stack completa de observabilidade em tempo real para bots Discord em produção: coleta de métricas de sistema, contadores de taxa por segundo, rastreamento de requisições com IDs de correlação, logs estruturados em JSON e streaming opcional via WebSocket para dashboards ao vivo.

## Instalação

```bash
npm install @shardix/provider-observability
```

## Configuração Rápida

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { createObservabilityProvider } from '@shardix/provider-observability';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    createObservabilityProvider({
      collectIntervalMs: 1000,
      logLevel: 'info',
      prettyLogs: process.env.NODE_ENV === 'development',
      wsMetrics: {
        enabled: true,
        port: 9090,
      },
    }),
  ],
});
```

---

## Métricas em Tempo Real

Todas as métricas são coletadas automaticamente a cada `collectIntervalMs` (padrão: 1000ms).

### Métricas de Sistema

| Métrica | Descrição |
|---------|-----------|
| `cpuUsagePercent` | Utilização real da CPU em % (delta entre amostras) |
| `memoryHeapUsedMB` | Heap V8 utilizado em MB |
| `memoryHeapTotalMB` | Heap V8 total alocado em MB |
| `memoryRssMB` | Resident Set Size (RSS) em MB |
| `memoryExternalMB` | Memória externa (Buffers/nativa) em MB |
| `eventLoopDelayMs` | Atraso do event loop em ms (via `monitorEventLoopDelay`) |
| `activeHandles` | Handles ativos do libuv |
| `activeRequests` | Requisições ativas do libuv |
| `uptimeSeconds` | Tempo de atividade do processo em segundos |

### Métricas de Discord e Framework

| Métrica | Descrição |
|---------|-----------|
| `interactionsPerSec` | Interações processadas por segundo (janela deslizante de 1s) |
| `commandsPerSec` | Comandos executados por segundo |
| `eventsPerSec` | Eventos de Gateway processados por segundo |
| `errorsPerSec` | Erros por segundo |
| `avgCommandDurationMs` | Tempo médio móvel de execução dos comandos |
| `p95CommandDurationMs` | Latência percentil 95 (p95) aproximada sobre os últimos 1.000 comandos |
| `gatewayPingMs` | Último ping registrado no WebSocket do Gateway |
| `cacheHitRatio` | Taxa de acertos do cache (0.0 a 1.0) |

---

## Acessando Métricas Programaticamente

```ts
import { Inject, Injectable } from '@shardix/common';
import { MetricsCollector, MetricsRecorder } from '@shardix/provider-observability';

@Injectable()
export class StatusService {
  constructor(
    @Inject(MetricsCollector) private collector: MetricsCollector,
    @Inject(MetricsRecorder) private recorder: MetricsRecorder,
  ) {}

  getSnapshot() {
    return this.collector.getCurrentMetrics();
    // Retorna o objeto completo LiveMetrics
  }
}
```

### Gravando Eventos Customizados

```ts
// Grava a execução de um comando
recorder.recordCommand('ping', durationMs);

// Grava um evento de Gateway
recorder.recordEvent('MESSAGE_CREATE');

// Grava acerto ou falha no cache
recorder.recordCacheHit();
recorder.recordCacheMiss();

// Atualiza o status do Gateway
recorder.updateGatewayPing(client.ws.ping);
recorder.updateGatewayStatus('connected');

// Grava um erro ocorrido
recorder.recordError(new Error('Falha na operação'), 'PingCommand');
```

---

## Logs Estruturados

```ts
import { Inject, Injectable } from '@shardix/common';
import { StructuredLogger } from '@shardix/provider-observability';
import type { CommandContext } from '@shardix/common';

@Injectable()
export class CommandService {
  constructor(
    @Inject(StructuredLogger) private logger: StructuredLogger,
  ) {}

  async handlePing(ctx: CommandContext) {
    this.logger.info('Executando /ping', {
      userId: ctx.userId,
      guildId: ctx.guildId,
    });

    try {
      await ctx.reply({ content: 'Pong!' });
      this.logger.debug('Resposta enviada com sucesso');
    } catch (err: any) {
      this.logger.error('Falha ao responder', err, { commandName: 'ping' });
    }
  }
}
```

**Saída em JSON** (produção):
```json
{"timestamp":"2026-08-04T12:00:00.000Z","level":"info","message":"Executando /ping","userId":"12345","guildId":"67890"}
{"timestamp":"2026-08-04T12:00:00.001Z","level":"debug","message":"Resposta enviada com sucesso"}
```

**Saída formatada e colorida** (desenvolvimento, `prettyLogs: true`):
```
[12:00:00] INFO  Executando /ping { userId: '12345', guildId: '67890' }
[12:00:00] DEBUG Resposta enviada com sucesso
```

### Loggers Filhos (Child Loggers)

```ts
// Cria um logger com atributos padrão persistentes
const commandLogger = this.logger.child({ component: 'PingCommand' });
commandLogger.info('Início'); // inclui automaticamente o campo component
```

---

## Rastreamento de Requisições (Request Tracing)

```ts
import { Inject, Injectable } from '@shardix/common';
import { Tracer } from '@shardix/provider-observability';
import type { CommandContext } from '@shardix/common';

@Injectable()
export class TracedCommandService {
  constructor(@Inject(Tracer) private tracer: Tracer) {}

  async handleHeavy(ctx: CommandContext) {
    // Inicia um span
    const span = this.tracer.startSpan('handle_heavy', {
      'discord.command': 'heavy',
      'discord.user.id': ctx.userId,
      'discord.guild.id': ctx.guildId,
    });

    try {
      await this.doWork();
      this.tracer.finishSpan(span.spanId);
    } catch (err: any) {
      this.tracer.finishSpan(span.spanId, err);
    }
  }

  // Obtém todos os spans ativos no momento
  getActiveTraces() {
    return this.tracer.getActiveSpans();
  }

  // Obtém histórico recente de spans concluídos
  getHistory() {
    return this.tracer.getCompletedSpans(50); // últimos 50
  }
}
```

Cada `TraceSpan` contém:
```ts
{
  spanId: 'uuid-v4',
  traceId: 'uuid-v4',
  correlationId: 'id-externo-opcional',
  operationName: 'handle_heavy',
  startTime: 1722772800000,
  duration: 12.4, // em ms, calculado na finalização
  status: 'completed',
  attributes: {
    'discord.command': 'heavy',
    'discord.user.id': '12345',
  }
}
```

---

## Stream de Métricas via WebSocket

Quando `wsMetrics.enabled = true`, um servidor WebSocket é iniciado na porta configurada. Qualquer cliente pode se conectar para receber métricas ao vivo a cada segundo:

```js
// Lado do cliente (dashboard, ferramenta de monitoramento, etc.)
const ws = new WebSocket('ws://localhost:9090');

ws.on('message', (raw) => {
  const { type, data } = JSON.parse(raw);
  if (type === 'metrics') {
    console.log('CPU:', data.cpuUsagePercent + '%');
    console.log('Interações/s:', data.interactionsPerSec);
    console.log('Latência p95:', data.p95CommandDurationMs + 'ms');
  }
});
```

Este servidor WebSocket alimenta os gráficos em tempo real no **Shardix Dashboard** na v0.9.

> [!NOTE]
> O servidor WebSocket requer o pacote `ws`: `npm install ws`. Se não estiver instalado, o servidor degrada graciosamente (sem erros nem disparo de eventos — todas as demais funções de métricas continuam normais).

---

## Referência de Configuração

```ts
createObservabilityProvider({
  /** Frequência de coleta das métricas do sistema em ms. Padrão: 1000 */
  collectIntervalMs: 1000,

  /** Nível mínimo de log para exibição. Padrão: 'info' */
  logLevel: 'info',

  /** Formatação amigável e colorida para dev. Padrão: false (JSON) */
  prettyLogs: false,

  /** Servidor de push de métricas via WebSocket */
  wsMetrics: {
    enabled: false,
    port: 9090,
  },
});
```
