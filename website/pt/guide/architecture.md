# Arquitetura & Injeção de Dependências

O Shardix adota padrões de arquitetura corporativa inspirados no NestJS, oferecendo um Container IoC robusto, Injeção de Dependências pelo construtor, motor de cache de Reflexão, Guards, Pipes e Interceptors.

---

## 🏗️ Visão Geral da Arquitetura em Camadas

```text
Aplicação (ShardixApplication)
        │
     Runtime (Gateway / HTTP / Híbrido / Distribuído)
        │
    Transport (WebSocket / Fastify / IPC Distribuído)
        │
     Adapter (Discord.js / Eris / Oceanic.js / Discordeno)
        │
    Provedores (Config / Logger / Cache / Queue / Dashboard)
```

---

## 💉 Injeção de Dependências (`@Injectable`)

Injete serviços de forma limpa em controllers ou outros serviços usando os tipos de parâmetros do construtor:

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

  @SlashCommand({ name: 'profile', description: 'Visualiza perfil do usuário' })
  async getProfile(interaction: any) {
    const user = await this.userService.getUser(interaction.user.id);
    return {
      type: 4,
      data: { content: `Usuário ${user.name} - Nível ${user.level}` },
    };
  }
}
```
