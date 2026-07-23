<h1 align="center">⚡ Shardix Framework</h1>

<p align="center">
  <b>Framework de Arquitetura Enterprise, Produtividade e Escalabilidade para Aplicações e Bots de Discord</b>
</p>

<p align="center">
  <a href="README.md">English</a> •
  <a href="#-sobre-o-shardix">Sobre o Shardix</a> •
  <a href="#-principais-recursos">Recursos</a> •
  <a href="#-arquitetura">Arquitetura</a> •
  <a href="#-começando-rápido">Guia Rápido</a> •
  <a href="#-pacotes-do-monorepo">Pacotes</a> •
  <a href="#-licença">Licença</a>
</p>

<p align="center">
  <img alt="Shardix Version" src="https://img.shields.io/badge/Vers%C3%A3o-0.2.5-8b5cf6?style=for-the-badge&logo=typescript">
  <img alt="Zero Vendor Lock-in" src="https://img.shields.io/badge/Vendor--Lock--in-ZERO-22c55e?style=for-the-badge">
  <img alt="Auditoria" src="https://img.shields.io/badge/Auditoria-APROVADO-22c55e?style=for-the-badge">
  <img alt="Runtime System" src="https://img.shields.io/badge/Runtime-Gateway%20%7C%20HTTP%20%7C%20H%C3%ADbrido-orange?style=for-the-badge">
  <img alt="Licença" src="https://img.shields.io/badge/licen%C3%A7a-MIT-green?style=for-the-badge">
</p>

---

## 💡 Sobre o Shardix

O **Shardix NÃO é uma biblioteca de Discord** e não substitui bibliotecas como `discord.js`, `Eris` ou `Discordeno`.

O Shardix é para bots o que o **[NestJS](https://nestjs.com/)** é para Express/Fastify:

> Um framework de arquitetura, produtividade, escalabilidade e padrão de engenharia.

Enquanto as bibliotecas de Discord cuidam do protocolo e comunicação de baixo nível, o **Shardix é responsável por**:
* 🏛️ **Clean Architecture & SOLID**
* ⚡ **Transport Layer Abstrato** (HTTP Interactions como Cidadão de Primeira Classe + Gateway)
* 🔌 **Zero Vendor Lock-in** (Adapters intercambiáveis)
* 📦 **Injeção de Dependências (Container IoC Nativo)** com suporte a escopos Singleton, Scoped e Transient
* 🎨 **Decorators Declarativos** (`@Controller()`, `@SlashCommand()`, `@Button()`, `@Event()`, etc.)
* 🚀 **Observabilidade e Infraestrutura Prontas** (Docker, Kubernetes, Redis, Pino Logger, Prometheus)

---

## 🚀 Principais Recursos

| Recurso | Descrição | Benefício |
|---------|-----------|-----------|
| **Zero Vendor Lock-in** | Núcleo desacoplado conversando exclusivamente através de `DiscordAdapter` | Troque de `discord.js` para `Eris` sem alterar a regra de negócio |
| **HTTP Interactions Nativo** | Servidor Fastify com validação criptográfica ed25519 nativa | Zero consumo de WebSocket, compatível com Serverless e economia de 90%+ RAM |
| **Container IoC Próprio** | Motor completo de Injeção de Dependências via Metadata Reflection | Facilidade em testes unitários e separação limpa de serviços |
| **Roteamento Universal** | O mesmo manipulador funciona via WebSocket Gateway ou HTTP Interactions | Escreva uma vez, rode onde quiser |
| **EventBus Distribuído** | Barramento de eventos local e Pub/Sub distribuído com Redis | Escalabilidade horizontal simplificada em clusters |
| **CLI Interativo** | Gerador `create-shardix` interativo | Crie projetos prontos para produção em segundos |

---

## 📦 Pacotes do Monorepo

```
packages/
├── @shardix/common       # Interfaces, decorators, metadados e constantes globais
├── @shardix/core         # Container IoC, Roteador universal e ShardixFactory
├── @shardix/transport    # Transportes Gateway e HTTP Interactions
├── @shardix/http         # Servidor HTTP Fastify e validação ed25519
├── @shardix/discordjs    # Adapter oficial para discord.js v14+
├── @shardix/logger       # Logger estruturado inspirado no Pino
├── @shardix/cache        # Abstração de Cache (Memory e Redis)
├── @shardix/events       # EventBus local e distribuído (Redis Pub/Sub)
└── create-shardix        # Ferramenta CLI interativa para scaffold de projetos
```

---

## 🛠️ Começando Rápido

### 1. Criando um projeto com o CLI

```bash
npx create-shardix
```

O assistente interativo guiará você na escolha da biblioteca, transporte (HTTP / Gateway / Híbrido), ORM (Prisma, Drizzle, TypeORM), Redis e configurações de Docker/Kubernetes.

### 2. Exemplo de Código Declarativo

```typescript
import { Controller, SlashCommand, Button, Injectable, Module } from '@shardix/common';
import { ShardixFactory } from '@shardix/core';
import { HttpInteractionsTransport } from '@shardix/transport';

@Injectable()
export class PingService {
  getPongMessage() {
    return 'Pong! Resposta enviada via Shardix HTTP Interactions 🚀';
  }
}

@Controller()
export class AppController {
  constructor(private pingService: PingService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Responde com pong',
  })
  async ping() {
    return {
      type: 4,
      data: {
        content: this.pingService.getPongMessage(),
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: 'Clique Aqui!',
                style: 1,
                custom_id: 'btn_ping',
              },
            ],
          },
        ],
      },
    };
  }

  @Button('btn_ping')
  async onButtonClick() {
    return {
      type: 4,
      data: { content: 'Botão clicado com sucesso! 🎉' },
    };
  }
}

@Module({
  controllers: [AppController],
  providers: [PingService],
})
export class AppModule {}

async function bootstrap() {
  const app = await ShardixFactory.create({
    transport: new HttpInteractionsTransport({
      port: 3000,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
    }),
  });

  app.register(AppModule);
  await app.start();
  console.log('Shardix rodando na porta 3000');
}

bootstrap();
```

---

## 📄 Licença

O Shardix é um software livre distribuído sob a licença [MIT](LICENSE).

---

<p align="center">
  Desenvolvido com 💜 para a comunidade de desenvolvedores Discord
</p>
