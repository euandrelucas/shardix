# Architecture & Dependency Injection

Shardix adopts NestJS-inspired enterprise architectural patterns, providing a robust IoC (Inversion of Control) Container, constructor dependency injection, Reflection caching engine, Guards, Pipes, and Interceptors.

---

## 🏗️ Layered Architecture Overview

```text
Application (ShardixApplication)
        │
     Runtime (Gateway / HTTP / Hybrid / Distributed)
        │
    Transport (WebSocket / Fastify / Distributed IPC)
        │
     Adapter (Discord.js / Eris / Oceanic.js / Discordeno)
        │
    Providers (Config / Logger / Cache / Queue / Dashboard)
```

---

## 💉 Dependency Injection (`@Injectable`)

Inject services cleanly into controllers or other services using constructor parameter types:

```typescript
import { Injectable, Controller, SlashCommand } from '@shardix/common';

@Injectable()
export class UserService {
  async getUser(id: string) {
    return { id, name: 'Alex', level: 42 };
  }
}

@Controller()
export class UserController {
  constructor(private userService: UserService) {}

  @SlashCommand({ name: 'profile', description: 'View user profile' })
  async getProfile(interaction: any) {
    const user = await this.userService.getUser(interaction.user.id);
    return {
      type: 4,
      data: { content: `User ${user.name} - Level ${user.level}` },
    };
  }
}
```

---

## 🛡️ Guards (`@UseGuards`)

Guards control access to commands and event handlers by evaluating execution contexts:

```typescript
import { Guard, ExecutionContext, Injectable, UseGuards, Controller, SlashCommand } from '@shardix/common';

@Injectable()
export class AdminGuard implements Guard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const payload = context.getPayload();
    const adminRole = '1234567890';
    return payload.member?.roles?.includes(adminRole) ?? false;
  }
}

@Controller()
@UseGuards(AdminGuard)
export class AdminController {
  @SlashCommand({ name: 'ban', description: 'Ban a user' })
  async banUser() {
    return { type: 4, data: { content: 'User banned.' } };
  }
}
```

---

## 🔄 Interceptors (`@UseInterceptors`)

Interceptors wrap method executions to add logging, performance measurement, or response mutation:

```typescript
import { Interceptor, ExecutionContext, Injectable } from '@shardix/common';

@Injectable()
export class LoggingInterceptor implements Interceptor {
  async intercept(context: ExecutionContext, next: () => Promise<any>): Promise<any> {
    const start = Date.now();
    const result = await next();
    const duration = Date.now() - start;
    console.log(`⚡ Execution took ${duration}ms`);
    return result;
  }
}
```
