# Architecture & Dependency Injection

Shardix is built on a **NestJS-inspired modular architecture** with a full IoC (Inversion of Control) container, decorator-based routing, and a clean separation between Discord adapters and application logic.

## Core Concepts

| Concept | Description |
|---------|-------------|
| `@Module()` | Groups related providers and controllers |
| `@Injectable()` | Marks a class as an injectable service |
| `@Controller()` | Marks a class as a command/event handler |
| `Container` | IoC container that manages dependencies |
| `ShardixApplication` | The root application instance |

## Modules

Modules are the fundamental building block of Shardix applications:

```typescript
import { Module } from '@shardix/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [DatabaseModule],       // Import other modules
  providers: [UserService],        // Register injectable services
  controllers: [UserController],   // Register command handlers
  exports: [UserService],          // Export providers for other modules
})
export class UserModule {}
```

### Root Module

Every Shardix app has a root `AppModule`:

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

Register it in your application:

```typescript
const app = await ShardixFactory.create({ adapter });
app.register(AppModule); // ← Register the root module
await app.start();
```

## Dependency Injection

Shardix has a full IoC container with support for:
- **Singleton** scope (default) — one instance per application
- **Scoped** scope — one instance per request
- **Transient** scope — new instance on every injection

### Basic Service Injection

```typescript
import { Injectable } from '@shardix/common';

@Injectable()
export class DatabaseService {
  async findUser(id: string) {
    // ...
  }
}

@Injectable()
export class UserService {
  // DatabaseService is automatically injected
  constructor(private readonly db: DatabaseService) {}

  async getUser(id: string) {
    return this.db.findUser(id);
  }
}
```

### Custom Injection Tokens

For non-class tokens (strings, symbols, primitives):

```typescript
import { Injectable, Inject } from '@shardix/common';

// In your module:
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => createRedisClient(),
    },
    {
      provide: 'CONFIG',
      useValue: { prefix: '!', debug: false },
    },
  ],
})
export class AppModule {}

// In your service:
@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private redis: any,
    @Inject('CONFIG') private config: any,
  ) {}
}
```

### Factory Providers

```typescript
@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: (config: ConfigService) => {
        return new DatabaseService(config.getDatabaseUrl());
      },
      inject: [ConfigService], // Dependencies for the factory
    },
  ],
})
export class AppModule {}
```

## Controllers

Controllers handle Discord interactions and events:

```typescript
import { Controller, SlashCommand, Button, Modal, SelectMenu, On } from '@shardix/common';
import { CommandContext } from '@shardix/common';

@Controller('moderation') // Optional prefix
export class ModerationController {
  @SlashCommand({ name: 'ban', description: 'Ban a user' })
  async ban(ctx: CommandContext) {
    // Handle /ban command
  }

  @Button('confirm_ban')
  async confirmBan(ctx: CommandContext) {
    // Handle button click with customId 'confirm_ban'
  }

  @Button(/^ban_/)  // RegExp matching for dynamic IDs
  async dynamicBan(ctx: CommandContext) {
    // Matches 'ban_123', 'ban_456', etc.
  }

  @Modal('ban_reason')
  async banModal(ctx: CommandContext) {
    // Handle modal submission
  }

  @SelectMenu('role_select')
  async roleSelect(ctx: CommandContext) {
    // Handle select menu selection
  }

  @On('guildMemberAdd')
  async onMemberJoin(member: any) {
    console.log('Member joined:', member.user.username);
  }
}
```

## Lifecycle Hooks

Modules and services can implement lifecycle interfaces:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@shardix/common';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Called after the module is initialized
    await this.connect();
    console.log('Database connected!');
  }

  async onModuleDestroy() {
    // Called before the module is destroyed
    await this.disconnect();
    console.log('Database disconnected.');
  }

  private async connect() { /* ... */ }
  private async disconnect() { /* ... */ }
}
```

Available hooks:
- `onModuleInit()` — called when the module is first initialized
- `onApplicationBootstrap()` — called after all modules have been initialized
- `onModuleDestroy()` — called when the application starts shutting down
- `onApplicationShutdown(signal?)` — called on SIGINT/SIGTERM with the signal name

## Guards

Guards protect routes from unauthorized access:

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

// Apply to a single command:
@SlashCommand({ name: 'admin', description: 'Admin only command' })
@UseGuards(AdminGuard)
async adminCommand(ctx: CommandContext) { /* ... */ }

// Apply to all commands in a controller:
@Controller()
@UseGuards(AdminGuard)
export class AdminController { /* ... */ }
```

## Interceptors

Interceptors wrap command execution for cross-cutting concerns:

```typescript
import { Injectable, Interceptor, ExecutionContext } from '@shardix/common';

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: () => Promise<any>) {
    const payload = context.getPayload();
    const start = Date.now();
    console.log(`Command: ${payload.data?.name}`);

    const result = await next(); // Execute the actual handler

    console.log(`Completed in ${Date.now() - start}ms`);
    return result;
  }
}

@SlashCommand({ name: 'ping', description: '...' })
@UseInterceptors(LoggingInterceptor)
async ping(ctx: CommandContext) { /* ... */ }
```

## Application Lifecycle

```
new ShardixApplication(options)
  ↓
app.register(AppModule)  →  loadModule()
  ↓                           ├─ Register providers in Container
app.start()                 ├─ Register controllers in Router
  ↓                           └─ Register events on Adapter
registerAll() + bootAll()  →  Boot all providers
  ↓
onModuleInit()  →  for all module instances
  ↓
onApplicationBootstrap()  →  for all module instances
  ↓
GatewayRuntime.start()  →  GatewayTransport.listen()
  ↓                           ↓
adapter.registerRawHandler()  adapter.login(token)
  ↓
[Bot is online and handling interactions]
  ↓
SIGINT/SIGTERM  →  app.stop()
  ↓
onModuleDestroy()  →  for all module instances
```
