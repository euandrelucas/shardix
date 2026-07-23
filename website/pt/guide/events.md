# Eventos & Interações de Componentes

O Shardix oferece um sistema declarativo unificado de decorators para escutar eventos nativos do Discord Gateway, comandos Slash, botões, modais, menus de seleção, autocompletar, menus de contexto e comandos de mensagem.

---

## 🎧 Eventos Nativos do Gateway (`@Event`, `@On`, `@Once`)

Você pode escutar qualquer evento nativo emitido pelo Discord.js, Eris, Oceanic.js ou Discordeno usando os decorators `@Event()`, `@On()` ou `@Once()`. Os objetos nativos do evento são passados diretamente para o seu método handler:

```typescript
import { Controller, Event, On, Once } from '@shardix/common';
import { GuildMember, Message } from 'discord.js';

@Controller()
export class GuildEventsController {
  // Escuta entrada de novos membros no servidor
  @Event('guildMemberAdd')
  onMemberJoin(member: GuildMember) {
    console.log(`[EVENT] Novo membro entrou: ${member.user.username}`);
  }

  // Alias @On para criação de mensagens
  @On('messageCreate')
  onMessage(message: Message) {
    if (message.author.bot) return;
    console.log(`[EVENT] Mensagem: ${message.content}`);
  }

  // Alias @Once para a inicialização do bot
  @Once('ready')
  onReady() {
    console.log('⚡ Conexão de Gateway Shardix Pronta!');
  }
}
```

---

## ⚔️ Comandos Slash (`@SlashCommand`)

Registre comandos slash da aplicação com suporte completo a metadados:

```typescript
import { Controller, SlashCommand } from '@shardix/common';

@Controller()
export class UserCommandsController {
  @SlashCommand({
    name: 'avatar',
    description: 'Obtém o avatar de um usuário',
  })
  async getAvatar(interaction: any) {
    return {
      type: 4,
      data: {
        content: `URL do Avatar: ${interaction.user?.avatar}`,
      },
    };
  }
}
```

---

## 🔘 Componentes de Mensagem (`@Button`, `@SelectMenu`, `@Modal`)

Manipule cliques em botões, menus dropdown de seleção e formulários modais usando IDs exatos ou Expressões Regulares:

```typescript
import { Controller, Button, SelectMenu, Modal } from '@shardix/common';

@Controller()
export class UIComponentsController {
  // Trata botão por ID exato
  @Button('confirm_action')
  async onConfirm(payload: any) {
    return {
      type: 4,
      data: { content: 'Ação confirmada!' },
    };
  }

  // Trata botões via padrão Regex dinâmico
  @Button(/^role_toggle_(\d+)$/)
  async onRoleToggle(payload: any) {
    return {
      type: 4,
      data: { content: 'Cargo alternado com sucesso.' },
    };
  }

  // Trata envio de Formulário Modal
  @Modal('feedback_modal')
  async onFeedbackSubmit(payload: any) {
    return {
      type: 4,
      data: { content: 'Obrigado pelo seu feedback!' },
    };
  }
}
```
