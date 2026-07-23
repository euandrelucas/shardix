# Shardix Framework

<p align="center">
  <img src="https://img.shields.io/badge/Shardix-Framework%20de%20Arquitetura-8b5cf6?style=for-the-badge&logo=discord" alt="Shardix Banner" />
</p>

<p align="center">
  <b>Framework de Arquitetura Corporativa e Produtividade para Bots e Aplicações Discord</b><br>
  Inspirado nos princípios arquiteturais do NestJS para Node.js & TypeScript.
</p>

<p align="center">
  <img alt="Shardix Version" src="https://img.shields.io/badge/Vers%C3%A3o-0.4.0-8b5cf6?style=for-the-badge&logo=typescript">
  <img alt="Zero Vendor Lock-in" src="https://img.shields.io/badge/Vendor--Lock--in-ZERO-22c55e?style=for-the-badge">
  <img alt="Suporte Multilib" src="https://img.shields.io/badge/Adapters-Discord.js%20%7C%20Eris%20%7C%20Oceanic.js%20%7C%20Discordeno-blue?style=for-the-badge">
  <img alt="Arquitetura Distribuída" src="https://img.shields.io/badge/Arquitetura-Workers%20Distribu%C3%ADdos-purple?style=for-the-badge">
  <img alt="Licença" src="https://img.shields.io/badge/licen%C3%A7a-MIT-green?style=for-the-badge">
</p>

---

## 💡 O que é o Shardix?

**O Shardix NÃO é uma biblioteca de Discord.** Ele não pretende substituir o `discord.js`, `Eris`, `Oceanic.js` ou `Discordeno`.

O Shardix é para bots o que o **NestJS** é para Express/Fastify:
> Um framework de arquitetura de software, injeção de dependências, escalabilidade, observabilidade e Developer Experience.

---

## 🔌 Zero Vendor Lock-in (Adapters Multi-Biblioteca)

No Shardix, sua regra de negócio (Controllers, Services, Guards, Interceptors) fica **100% desacoplada** de qualquer biblioteca de Discord. Você pode trocar a biblioteca a qualquer momento alterando apenas uma linha de código!

Adapters Oficiais:
* `@shardix/discordjs`: Adapter oficial para Discord.js
* `@shardix/eris`: Adapter oficial para Eris
* `@shardix/oceanicjs`: Adapter oficial para Oceanic.js
* `@shardix/discordeno`: Adapter oficial para Discordeno

---

## ⚡ Exemplo Prático de Código (Alternando Adapters)

```typescript
import { Controller, SlashCommand } from '@shardix/common';
import { ShardixFactory, AutoScanner } from '@shardix/core';

// 1. Escolha QUALQUER Adapter de Biblioteca Discord
import { DiscordJSAdapter } from '@shardix/discordjs';
// import { ErisAdapter } from '@shardix/eris';
// import { OceanicAdapter } from '@shardix/oceanicjs';
// import { DiscordenoAdapter } from '@shardix/discordeno';

@Controller()
export class PingController {
  @SlashCommand({ name: 'ping', description: 'Verifica a resposta do bot' })
  async ping() {
    return {
      type: 4,
      data: {
        content: '🏓 Pong! O Shardix está rodando com ZERO Vendor Lock-in!',
      },
    };
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(), // Alterne para ErisAdapter, OceanicAdapter ou DiscordenoAdapter a qualquer momento!
  });

  AutoScanner.scanAndRegister(app, [PingController]);

  await app.start();
}

bootstrap();
```

---

## 🏢 Arquitetura em Camadas Corporativa

```text
                 Application
                     │
             Distributed Runtime
        ┌────────────┼────────────┐
     Worker       Worker       Worker
        │            │            │
    Transport    Transport    Transport
        │            │            │
     Adapter      Adapter      Adapter
        │            │            │
    Providers    Providers    Providers
```

---

## 🛠️ Pacotes do Ecossistema Oficial

| Pacote | Descrição |
|---|---|
| `@shardix/common` | Interfaces, contratos e decorators (`@Controller`, `@SlashCommand`, `@Injectable`) |
| `@shardix/core` | Container IoC, Injeção de Dependências, Roteador e Motor de Reflexão |
| `@shardix/cluster` | Gerenciador de Cluster e abstrações de `WorkerNode` |
| `@shardix/ipc` | Camada de comunicação de mensagens inter-processos e distribuída |
| `@shardix/runtime-distributed` | Runtime Distribuído que orquestra trabalhadores |
| `@shardix/provider-config` | API de configuração com suporte a `shardix.config.ts` e `.env` |
| `@shardix/provider-logger` | Logger estruturado de alta performance (JSON & Pretty) |
| `@shardix/provider-cache` | Provedor unificado de Cache (Memória & Redis) |
| `@shardix/provider-eventbus` | Provedor de Barramento de Eventos Local e Distribuído |
| `@shardix/provider-health` | Provedor de Sondagens de Saúde (Liveness e Readiness) |
| `@shardix/provider-queue` | Provedor de Filas de Tarefas em Background (Retries & Jobs Agendados) |
| `@shardix/provider-observability` | Provedor de Observabilidade (OpenTelemetry & Prometheus) |
| `@shardix/dashboard-api` | API REST para monitoramento de workers, saúde, logs e métricas |
| `@shardix/cli` | CLI interativa para geração de código e diagnósticos de produção |

---

## 📄 Licença

MIT © [Equipe Shardix](LICENSE)
