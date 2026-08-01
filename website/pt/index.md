---
layout: home

hero:
  name: "Shardix"
  text: "Framework Discord Enterprise"
  tagline: "Construa bots de Discord escaláveis e prontos para produção com arquitetura inspirada no NestJS. Zero vendor lock-in. Qualquer biblioteca."
  actions:
    - theme: brand
      text: Primeiros Passos →
      link: /pt/guide/getting-started
    - theme: alt
      text: Ver no GitHub
      link: https://github.com/euandrelucas/shardix
    - theme: alt
      text: Entrar no Discord
      link: https://discord.gg/shardix

features:
  - icon: 🔌
    title: Zero Vendor Lock-in
    details: Escreva uma vez, rode com Discord.js, Eris, Oceanic.js ou Discordeno. Troque de biblioteca sem mexer na sua lógica de negócio.
    link: /pt/guide/adapters
    linkText: Sobre adapters

  - icon: 🏗️
    title: Arquitetura Inspirada no NestJS
    details: Design modular com @Module, @Injectable, @Controller e um container IoC completo. Feito para bots de grande escala e fácil manutenção.
    link: /pt/guide/architecture
    linkText: Sobre injeção de dependência

  - icon: ⚡
    title: Motor Multi-Runtime
    details: Execute via Gateway WebSocket, interações HTTP Webhook ou modo Híbrido. Faça deploy em qualquer lugar — VPS, serverless, Kubernetes.
    link: /pt/guide/runtimes
    linkText: Comparar runtimes

  - icon: 🧩
    title: Providers Oficiais
    details: Config, Pino Logger, Cache Memória/Redis, EventBus, Filas de Tarefas, Verificações de Saúde e Observabilidade OpenTelemetry.
    link: /pt/guide/providers
    linkText: Ver providers

  - icon: 🎛️
    title: Control Plane Dashboard
    details: Telemetria em tempo real, monitoramento de saúde de workers, analytics de comandos, streams de log ao vivo e endpoints REST.
    link: /pt/guide/dashboard
    linkText: Configurar dashboard

  - icon: 🧪
    title: Testes de Primeira Classe
    details: Utilitários de teste integrados com MockDiscordAdapter, createTestingApplication e helpers de mockInteraction.
    link: /pt/guide/testing
    linkText: Escrever testes
---

## Por que Shardix?

```typescript
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { Module, Controller, SlashCommand, Injectable, CommandContext, EmbedBuilder } from '@shardix/common';

@Injectable()
class ServicoBoasVindas {
  cumprimentar(username: string) {
    return `Olá, ${username}! Bem-vindo ao Shardix ⚡`;
  }
}

@Controller()
class PingController {
  constructor(private boasVindas: ServicoBoasVindas) {}

  @SlashCommand({ name: 'ping', description: 'Pingar o bot' })
  async ping(ctx: CommandContext) {
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(this.boasVindas.cumprimentar(ctx.user.username))
      .setColor(0x5865F2)
      .setTimestamp();

    return ctx.reply({ embeds: [embed.toJSON()] });
  }
}

@Module({ providers: [ServicoBoasVindas], controllers: [PingController] })
class AppModule {}

const app = await ShardixFactory.create({ adapter: new DiscordJSAdapter() });
app.register(AppModule);
await app.start();
```

## Comunidade

<div class="community-links">
  <a href="https://github.com/euandrelucas/shardix" target="_blank">⭐ Star no GitHub</a> ·
  <a href="https://discord.gg/shardix" target="_blank">💬 Entrar no Discord</a> ·
  <a href="https://www.npmjs.com/org/shardix" target="_blank">📦 Ver no npm</a>
</div>
