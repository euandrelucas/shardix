# Primeiros Passos

Bem-vindo ao **Shardix Framework** — o framework de arquitetura enterprise para construir bots de Discord escaláveis. Pense no NestJS, mas para Discord.

## Pré-requisitos

- Node.js **18.0.0** ou superior
- Uma aplicação Discord e token de bot ([Crie aqui](https://discord.com/developers/applications))
- npm, pnpm, yarn ou bun

## Criando um Novo Projeto

A forma mais rápida de começar é com o CLI do Shardix:

```bash
npx @shardix/cli new meu-bot
```

O wizard interativo irá perguntar:
- **Nome do projeto** — o nome do seu projeto de bot
- **Adapter da biblioteca Discord** — Discord.js (recomendado), Eris, Oceanic.js ou Discordeno
- **Tipo de transporte** — Gateway (WebSocket), HTTP Interactions ou Híbrido
- **ORM de banco de dados** — Prisma, Drizzle ORM ou Nenhum
- **Cache Redis** — para cache distribuído e event bus
- **Configuração Docker** — gera Dockerfile e docker-compose.yml

O CLI também irá perguntar se deseja **instalar as dependências automaticamente**.

## Instalação Manual

Se preferir configurar manualmente:

```bash
# Instalar pacotes principais
npm install @shardix/core @shardix/common @shardix/discordjs discord.js dotenv

# Instalar dependências de desenvolvimento
npm install --save-dev typescript tsx tsup @types/node
```

## Estrutura do Projeto

Um projeto Shardix segue uma arquitetura modular inspirada no NestJS:

```
src/
├── app.module.ts          # Módulo raiz — registra todos os providers e controllers
├── main.ts                # Ponto de entrada da aplicação
├── register-commands.ts   # Script de registro de slash commands
├── ping.controller.ts     # Comandos, botões, eventos
└── user.service.ts        # Lógica de negócio (serviço injetável)
```

## Passo 1: Configurar o TypeScript

Crie o `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "strict": false,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

::: warning Importante
`experimentalDecorators` e `emitDecoratorMetadata` **devem** ser `true` — o Shardix usa decorators do TypeScript para seu sistema de DI e roteamento.
:::

## Passo 2: Configurar Variáveis de Ambiente

Crie o `.env`:

```env
DISCORD_TOKEN=seu_token_de_bot_aqui
CLIENT_ID=seu_id_de_aplicacao_aqui
# Opcional: para atualizações instantâneas durante o desenvolvimento
GUILD_ID=id_do_seu_servidor_de_testes
```

Para obter esses valores:
1. Acesse o [Portal do Desenvolvedor Discord](https://discord.com/developers/applications)
2. Crie uma nova aplicação → copie o **ID da Aplicação** → é o seu `CLIENT_ID`
3. Vá para a aba **Bot** → Redefinir Token → copie → é o seu `DISCORD_TOKEN`
4. Ative **Message Content Intent**, **Server Members Intent** e **Presence Intent** na aba Bot
5. Convide o bot para seu servidor usando o gerador de URL do OAuth2

## Passo 3: Criar o Módulo Raiz

Crie `src/app.module.ts`:

```typescript
import { Module } from '@shardix/common';
import { PingController } from './ping.controller.js';
import { UserService } from './user.service.js';

@Module({
  providers: [UserService],      // Serviços injetáveis
  controllers: [PingController], // Handlers de comandos/eventos
})
export class AppModule {}
```

## Passo 4: Criar um Serviço

Crie `src/user.service.ts`:

```typescript
import { Injectable } from '@shardix/common';

@Injectable()
export class UserService {
  async getMensagemBoasVindas(username: string): Promise<string> {
    return `Bem-vindo, ${username}! ⚡`;
  }

  async getEstatisticasUsuario(userId: string) {
    return { userId, comandos: 42, entrou: new Date() };
  }
}
```

## Passo 5: Criar um Controller

Crie `src/ping.controller.ts`:

```typescript
import {
  Controller,
  SlashCommand,
  Button,
  On,
  CommandContext,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from '@shardix/common';
import { UserService } from './user.service.js';

@Controller()
export class PingController {
  constructor(private readonly userService: UserService) {}

  @SlashCommand({
    name: 'ping',
    description: 'Verificar latência e status do bot',
  })
  async ping(ctx: CommandContext) {
    const boasVindas = await this.userService.getMensagemBoasVindas(ctx.user.username);

    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .setDescription(boasVindas)
      .setColor(0x5865f2)
      .setTimestamp()
      .setFooter({ text: 'Shardix Framework' });

    const botao = new ButtonBuilder()
      .setCustomId('ping_novamente')
      .setLabel('Pingar Novamente!')
      .setStyle(ButtonStyle.Primary);

    const linha = new ActionRowBuilder().addComponents(botao);

    return ctx.reply({
      embeds: [embed.toJSON()],
      components: [linha.toJSON()],
    });
  }

  @Button('ping_novamente')
  async aoPingNovamente(ctx: CommandContext) {
    return ctx.reply({
      content: '🏓 Pong novamente!',
      ephemeral: true,
    });
  }

  @On('ready')
  aoFicarPronto(client: any) {
    console.log(`✅ Conectado como ${client.user.tag}`);
  }
}
```

## Passo 6: Criar o Ponto de Entrada

Crie `src/main.ts`:

```typescript
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config(); // ← Deve ser PRIMEIRO, antes de qualquer import do Shardix

import { ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN ausente no .env!');
    process.exit(1);
  }

  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  app.register(AppModule);

  await app.start();
  console.log('🚀 Bot está rodando!');
}

bootstrap().catch((err) => {
  console.error('❌ Erro no bootstrap:', err);
  process.exit(1);
});
```

::: tip dotenv deve ser o primeiro
Sempre chame `dotenv.config()` **antes** de importar qualquer coisa do Shardix. Caso contrário, `process.env.DISCORD_TOKEN` será `undefined` quando o adapter for criado.
:::

## Passo 7: Registrar Slash Commands

Slash commands devem ser registrados na API do Discord antes de aparecerem no servidor. Crie `src/register-commands.ts`:

```typescript
import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { REST, Routes } from 'discord.js';

const commands = [
  { name: 'ping', description: 'Verificar latência e status do bot' },
];

async function registrarComandos() {
  const token = process.env.DISCORD_TOKEN!;
  const clientId = process.env.CLIENT_ID!;
  const guildId = process.env.GUILD_ID; // Opcional: para atualizações instantâneas

  if (!token || !clientId) {
    console.error('❌ DISCORD_TOKEN ou CLIENT_ID ausente');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(token);

  console.log('📡 Registrando slash commands...');

  if (guildId) {
    // Comandos de servidor atualizam instantaneamente (ótimo para desenvolvimento!)
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`✅ ${commands.length} comandos de servidor registrados em ${guildId}`);
  } else {
    // Comandos globais levam até 1 hora para propagar
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log(`✅ ${commands.length} comandos globais registrados`);
  }
}

registrarComandos().catch(console.error);
```

Execute:

```bash
npx tsx src/register-commands.ts
# ou
npm run register-commands
```

::: tip Dica de desenvolvimento
Defina `GUILD_ID` no `.env` durante o desenvolvimento — comandos de servidor atualizam **instantaneamente** em vez de esperar até 1 hora pelos comandos globais.
:::

## Passo 8: Executar o Bot

```bash
# Modo de desenvolvimento (hot reload)
npm run dev

# Produção
npm run build && npm start
```

Você deve ver:
```
🚀 Bot está rodando!
✅ Conectado como MeuBot#1234
```

## Solução de Problemas

### ❌ `Cannot find module 'discord.js'`
Certifique-se de que o discord.js está instalado: `npm install discord.js`

### ❌ `DISCORD_TOKEN ausente`
- Verifique se o `.env` existe na raiz do projeto
- Certifique-se de que `dotenv.config()` é chamado **primeiro** no `main.ts`
- Verifique se o token está correto no Portal do Desenvolvedor Discord

### ❌ Slash commands não aparecem
- Execute `npm run register-commands`
- Para desenvolvimento, defina `GUILD_ID` para atualizações instantâneas
- Verifique se o bot tem o escopo `applications.commands` na URL de convite

### ❌ Bot não responde aos comandos
- Certifique-se de que o bot tem **Message Content Intent** ativado no Portal do Desenvolvedor
- Verifique se os comandos estão registrados (execute `register-commands` novamente)
- Verifique se o bot está online e no servidor

### ❌ Erros de `experimentalDecorators`
- Adicione `"experimentalDecorators": true` e `"emitDecoratorMetadata": true` ao `tsconfig.json`
- Reinicie o servidor TypeScript na sua IDE

## Próximos Passos

- [Arquitetura e Injeção de Dependência](/pt/guide/architecture) — Aprenda sobre @Module, @Injectable e o container IoC
- [Eventos e Contexto Unificado](/pt/guide/events) — Manipule eventos Discord com @On e @Once
- [Builders Universais](/pt/guide/builders) — Construa embeds, botões, modais e muito mais
- [Adapters Multi-Biblioteca](/pt/guide/adapters) — Alterne entre Discord.js, Eris e outros
