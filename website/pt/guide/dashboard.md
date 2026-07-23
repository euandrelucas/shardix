# Control Plane Dashboard

O **Shardix Control Plane Dashboard** oficial oferece telemetria em tempo real, saúde dos trabalhadores, analíticos de comandos executados, logs ao vivo e endpoints REST seguros para gerenciar aplicações Shardix em produção.

---

## 🚀 Habilitando o Dashboard

Registre o `DashboardProvider` na sua aplicação:

```typescript
import { ShardixFactory } from '@shardix/core';
import { DashboardProvider } from '@shardix/provider-dashboard';

async function bootstrap() {
  const app = await ShardixFactory.create();

  // Registra o Control Plane Dashboard na porta 3005
  app.use(new DashboardProvider({
    port: 3005,
    token: process.env.SHARDIX_DASHBOARD_TOKEN || 'secret_admin_token',
  }));

  await app.start();
  console.log('🎛️ Control Plane Dashboard executando em http://localhost:3005');
}

bootstrap();
```

---

## 📡 Endpoints REST da API

| Endpoint | Método | Descrição |
| :--- | :--- | :--- |
| `/api/application` | `GET` | Metadados da aplicação, versão e tempo online |
| `/api/runtime` | `GET` | Estado do runtime ativo e detalhes do transporte |
| `/api/workers` | `GET` | Estado dos workers em cluster e uso de memória |
| `/api/shards` | `GET` | Alocações de shards e latência do Gateway |
| `/api/health` | `GET` | Sondagens de saúde Liveness & Readiness |
| `/api/metrics` | `GET` | Métricas OpenTelemetry e fluxo de comandos |
| `/api/events` | `GET` | Log de auditoria dos eventos |
| `/api/logs` | `GET` | Stream de logs Pino em tempo real |
