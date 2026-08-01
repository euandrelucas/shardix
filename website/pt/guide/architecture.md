# Arquitetura e Injeção de Dependência

O Shardix é construído sobre uma **arquitetura modular inspirada no NestJS** com um container IoC (Inversão de Controle) completo, roteamento baseado em decorators e uma separação clara entre adapters Discord e lógica de aplicação.

## Conceitos Centrais

| Conceito | Descrição |
|---------|-------------|
| `@Module()` | Agrupa providers e controllers relacionados |
| `@Injectable()` | Marca uma classe como serviço injetável |
| `@Controller()` | Marca uma classe como handler de comandos/eventos |
| `Container` | Container IoC que gerencia dependências |
| `ShardixApplication` | A instância raiz da aplicação |

## Módulos

Módulos são o bloco fundamental de construção das aplicações Shardix:

```typescript
import { Module } from '@shardix/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [DatabaseModule],       // Importar outros módulos
  providers: [UserService],        // Registrar serviços injetáveis
  controllers: [UserController],   // Registrar handlers de comandos
  exports: [UserService],          // Exportar providers para outros módulos
})
export class UserModule {}
```

### Módulo Raiz

Toda aplicação Shardix tem um `AppModule` raiz:

```typescript
import { Module } from '@shardix/common';
import { UserModule } from './user/user.module.js';
import { ModerationModule } from './moderation/moderation.module.js';

@Module({
  imports: [
    UserModule,
    ModerationModule,
  ],
})
export class AppModule {}
```

Registre-o na sua aplicação:

```typescript
const app = await ShardixFactory.create({ adapter });
app.register(AppModule); // ← Registra o módulo raiz
await app.start();
```

## Injeção de Dependência

O Shardix tem um container IoC completo com suporte a:
- **Singleton** (padrão) — uma instância por aplicação
- **Scoped** — uma instância por requisição
- **Transient** — nova instância a cada injeção

### Injeção Básica de Serviço

```typescript
import { Injectable } from '@shardix/common';

@Injectable()
export class DatabaseService {
  async buscarUsuario(id: string) {
    // ...
  }
}

@Injectable()
export class UserService {
  // DatabaseService é injetado automaticamente
  constructor(private readonly db: DatabaseService) {}

  async getUsuario(id: string) {
    return this.db.buscarUsuario(id);
  }
}
```

### Tokens de Injeção Customizados

Para tokens não-classe (strings, símbolos, primitivos):

```typescript
import { Injectable, Inject } from '@shardix/common';

// No seu módulo:
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => criarClienteRedis(),
    },
    {
      provide: 'CONFIG',
      useValue: { prefixo: '!', debug: false },
    },
  ],
})
export class AppModule {}

// No seu serviço:
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: any,
    @Inject('CONFIG') private config: any,
  ) {}
}
```

### Providers com Factory

```typescript
@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: (config: ConfigService) => {
        return new DatabaseService(config.getDatabaseUrl());
      },
      inject: [ConfigService], // Dependências para a factory
    },
  ],
})
export class AppModule {}
```

## Controllers

Controllers manipulam interações e eventos do Discord:

```typescript
import { Controller, SlashCommand, Button, Modal, SelectMenu, On } from '@shardix/common';
import { CommandContext } from '@shardix/common';

@Controller('moderacao') // Prefixo opcional
export class ModerationController {
  @SlashCommand({ name: 'banir', description: 'Banir um usuário' })
  async banir(ctx: CommandContext) {
    // Manipular o comando /banir
  }

  @Button('confirmar_ban')
  async confirmarBan(ctx: CommandContext) {
    // Manipular clique no botão com customId 'confirmar_ban'
  }

  @Button(/^ban_/)  // Matching com RegExp para IDs dinâmicos
  async banDinamico(ctx: CommandContext) {
    // Corresponde a 'ban_123', 'ban_456', etc.
  }

  @Modal('motivo_ban')
  async modalBan(ctx: CommandContext) {
    // Manipular envio de modal
  }

  @SelectMenu('selecionar_cargo')
  async selecionarCargo(ctx: CommandContext) {
    // Manipular seleção do menu
  }

  @On('guildMemberAdd')
  async aoMembroEntrar(member: any) {
    console.log('Membro entrou:', member.user.username);
  }
}
```

## Hooks de Ciclo de Vida

Módulos e serviços podem implementar interfaces de ciclo de vida:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@shardix/common';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Chamado após o módulo ser inicializado
    await this.conectar();
    console.log('Banco de dados conectado!');
  }

  async onModuleDestroy() {
    // Chamado antes do módulo ser destruído
    await this.desconectar();
    console.log('Banco de dados desconectado.');
  }

  private async conectar() { /* ... */ }
  private async desconectar() { /* ... */ }
}
```

Hooks disponíveis:
- `onModuleInit()` — chamado quando o módulo é inicializado
- `onApplicationBootstrap()` — chamado após todos os módulos serem inicializados
- `onModuleDestroy()` — chamado quando a aplicação começa a desligar
- `onApplicationShutdown(signal?)` — chamado no SIGINT/SIGTERM com o nome do sinal

## Guards

Guards protegem rotas de acesso não autorizado:

```typescript
import { Injectable, Guard, ExecutionContext } from '@shardix/common';

@Injectable()
export class AdminGuard implements Guard {
  canActivate(context: ExecutionContext): boolean {
    const payload = context.getPayload();
    const adminIds = ['123456789', '987654321'];
    return adminIds.includes(payload.user?.id || payload.member?.user?.id);
  }
}

// Aplicar em um único comando:
@SlashCommand({ name: 'admin', description: 'Comando só para admins' })
@UseGuards(AdminGuard)
async comandoAdmin(ctx: CommandContext) { /* ... */ }

// Aplicar em todos os comandos de um controller:
@Controller()
@UseGuards(AdminGuard)
export class AdminController { /* ... */ }
```

## Interceptors

Interceptors envolvem a execução de comandos para preocupações transversais:

```typescript
import { Injectable, Interceptor, ExecutionContext } from '@shardix/common';

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const payload = context.getPayload();
    const inicio = Date.now();
    console.log(`Comando: ${payload.data?.name}`);

    const resultado = await next(); // Executar o handler real

    console.log(`Concluído em ${Date.now() - inicio}ms`);
    return resultado;
  }
}

@SlashCommand({ name: 'ping', description: '...' })
@UseInterceptors(LoggingInterceptor)
async ping(ctx: CommandContext) { /* ... */ }
```

## Ciclo de Vida da Aplicação

```
new ShardixApplication(options)
  ↓
app.register(AppModule)  →  loadModule()
  ↓                           ├─ Registrar providers no Container
app.start()                 ├─ Registrar controllers no Router
  ↓                           └─ Registrar eventos no Adapter
registerAll() + bootAll()  →  Inicializar todos os providers
  ↓
onModuleInit()  →  para todas as instâncias de módulo
  ↓
onApplicationBootstrap()  →  para todas as instâncias de módulo
  ↓
GatewayRuntime.start()  →  GatewayTransport.listen()
  ↓                           ↓
adapter.registerRawHandler()  adapter.login(token)
  ↓
[Bot está online e respondendo interações]
  ↓
SIGINT/SIGTERM  →  app.stop()
  ↓
onModuleDestroy()  →  para todas as instâncias de módulo
```
