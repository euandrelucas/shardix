# Provedores Oficiais

Provedores estendem sua aplicação com capacidades de infraestrutura.

## Provedores Disponíveis

- `@shardix/provider-config`: Carregador de variáveis de ambiente `.env` e `shardix.config.ts`
- `@shardix/provider-logger`: Logger estruturado Pino de alta velocidade
- `@shardix/provider-cache`: Cache unificado em Memória e Redis
- `@shardix/provider-eventbus`: Barramento de eventos Local e Pub/Sub Distribuído
- `@shardix/provider-health`: Sondagens de saúde Liveness/Readiness para Kubernetes & Docker
- `@shardix/provider-queue`: Filas de tarefas em segundo plano (Retries & Delayed jobs)
- `@shardix/provider-observability`: Métricas OpenTelemetry & Prometheus
- `@shardix/provider-dashboard`: Integração com o Control Plane Dashboard

## Uso

```typescript
import { ConfigProvider } from '@shardix/provider-config';
import { LoggerProvider } from '@shardix/provider-logger';
import { CacheProvider } from '@shardix/provider-cache';
import { DashboardProvider } from '@shardix/provider-dashboard';

app
  .use(new ConfigProvider())
  .use(new LoggerProvider())
  .use(new CacheProvider())
  .use(new DashboardProvider({ port: 3005 }));
```
