---
title: Health Checks — /health, /ready, /live, /metrics
description: Endpoints de health probes compatíveis com K8s e métricas Prometheus para bots Shardix rodando em produção.
---

# 🏥 Health Checks

O `@shardix/provider-health` expõe endpoints HTTP de health probe de nível corporativo compatíveis com **Kubernetes**, health checks do **Docker Compose** e monitoramento via **Prometheus** — sem qualquer dependência de framework HTTP externo.

## Instalação

```bash
npm install @shardix/provider-health
```

## Configuração Rápida

```ts
import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { createHealthProvider } from '@shardix/provider-health';

const app = await ShardixFactory.create({
  adapter: new DiscordJSAdapter(),
  providers: [
    createHealthProvider({
      server: { port: 8080 },
      description: 'Meu Bot Discord',
      version: process.env.npm_package_version,
    })
      .addCheck('discord_gateway', () => client.ws.ping < 500)
      .addCheck('redis', async () => {
        await redis.ping();
        return true;
      }),
  ],
});
```

---

## Endpoints HTTP

Assim que o provider é inicializado, 4 endpoints ficam disponíveis:

### `GET /health`

Resposta completa de Health Check no padrão RFC ([draft-inadarei-api-health-check](https://datatracker.ietf.org/doc/html/draft-inadarei-api-health-check)):

```json
{
  "status": "pass",
  "version": "1.0.0",
  "description": "Meu Bot Discord",
  "checks": {
    "discord_gateway": [{
      "componentName": "discord_gateway",
      "componentType": "external",
      "status": "pass",
      "durationMs": 2,
      "time": "2026-08-04T12:00:00.000Z"
    }],
    "redis": [{
      "componentName": "redis",
      "componentType": "datastore",
      "status": "pass",
      "durationMs": 1,
      "time": "2026-08-04T12:00:00.000Z"
    }],
    "memory": [{
      "componentName": "memory",
      "componentType": "system",
      "status": "pass",
      "observedValue": "48",
      "observedUnit": "MB"
    }]
  }
}
```

- `200 OK` quando o status for `pass` ou `warn`
- `503 Service Unavailable` quando o status for `fail`

### `GET /ready`

Readiness probe do Kubernetes — o bot está pronto para receber e processar tráfego?

```json
{ "ready": true }
```

Retorna `503` se qualquer verificação marcada como **crítica** falhar.

### `GET /live`

Liveness probe do Kubernetes — o processo está vivo e em execução?

```json
{
  "live": true,
  "pid": 12345,
  "uptime": 3600
}
```

Sempre retorna `200` enquanto o processo Node.js estiver em execução.

### `GET /metrics`

Formato de texto do Prometheus pronto para scraping:

```
# HELP shardix_health_check_up Check status (1=pass, 0=fail)
# TYPE shardix_health_check_up gauge
shardix_health_check_up{name="discord_gateway"} 1
shardix_health_check_up{name="redis"} 1
shardix_health_check_up{name="memory"} 1

# HELP shardix_uptime_seconds Process uptime in seconds
# TYPE shardix_uptime_seconds counter
shardix_uptime_seconds 3600

# HELP shardix_memory_heap_bytes Heap memory used
# TYPE shardix_memory_heap_bytes gauge
shardix_memory_heap_bytes 50331648

# HELP shardix_memory_rss_bytes RSS memory
# TYPE shardix_memory_rss_bytes gauge
shardix_memory_rss_bytes 104857600
```

---

## Registrando Verificações Customizadas

### Verificação booleana simples

```ts
provider.addCheck('discord_gateway', () => client.ws.ping < 500);
```

### Verificação assíncrona com timeout

```ts
provider.addCheck('database', async () => {
  await db.query('SELECT 1');
  return true;
}, {
  componentType: 'datastore',
  timeoutMs: 3000,  // falha se demorar mais de 3s
  critical: true,   // falhar aqui define o status geral como 'fail'
});
```

### Verificação detalhada com saída customizada

```ts
import { HealthCheckDefinition } from '@shardix/provider-health';

const redisCheck: HealthCheckDefinition = {
  name: 'redis',
  componentType: 'datastore',
  timeoutMs: 2000,
  critical: true,
  handler: async () => {
    const start = Date.now();
    try {
      await redis.ping();
      return {
        componentName: 'redis',
        componentType: 'datastore',
        status: 'pass',
        observedValue: Date.now() - start,
        observedUnit: 'ms',
        time: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        componentName: 'redis',
        componentType: 'datastore',
        status: 'fail',
        output: err.message,
        time: new Date().toISOString(),
        durationMs: Date.now() - start,
      };
    }
  },
};

healthService.register(redisCheck);
```

---

## Configuração

```ts
createHealthProvider({
  // Opções do servidor HTTP
  server: {
    port: 8080,             // padrão: 8080
    host: '0.0.0.0',        // padrão: '0.0.0.0'
    path: '',               // prefixo de rota, ex: '/shardix'
    enabled: true,          // padrão: true
  },

  // Metadados da resposta
  version: '1.0.0',
  description: 'Meu Bot Discord',
});
```

**Prefixo de rota personalizado:**
```ts
createHealthProvider({ server: { port: 8080, path: '/shardix' } })
// Expõe: /shardix/health, /shardix/ready, /shardix/live, /shardix/metrics
```

---

## Integração com Kubernetes

```yaml
# Trecho de manifesto de deployment K8s
livenessProbe:
  httpGet:
    path: /live
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5

# Anotações para scraping do Prometheus
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"
```

---

## Integração com Docker Compose

```yaml
services:
  bot:
    image: meu-bot-shardix
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/ready"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    ports:
      - "8080:8080"
```

---

## Acessando HealthService no Container DI

```ts
import { Inject, Injectable } from '@shardix/common';
import { HealthService } from '@shardix/provider-health';

@Injectable()
export class AdminService {
  constructor(@Inject(HealthService) private health: HealthService) {}

  async getStatus() {
    const result = await this.health.check();
    return result; // HealthCheckResponse completo
  }

  async isReady() {
    return this.health.isReady(); // boolean
  }
}
```

---

## Verificações Embutidas

Estas verificações são registradas automaticamente:

| Verificação | Tipo | Condição |
|-------------|------|----------|
| `memory` | system | Emite aviso se heap > 512MB, falha se > 1GB |
| `uptime` | system | Sempre passa, expõe o tempo de atividade em segundos |
