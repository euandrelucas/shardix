# Events & Component Interactions

Shardix provides a unified, declarative decorator system for handling native Discord Gateway events, Slash Commands, Buttons, Modals, Select Menus, Autocomplete, Context Menus, and Message Commands.

---

## 🎧 Native Gateway Events (`@Event`, `@On`, `@Once`)

You can listen to any native Discord event emitted by Discord.js, Eris, Oceanic.js, or Discordeno using `@Event()`, `@On()`, or `@Once()`. Native event objects are passed directly into your handler methods.

```typescript
import { Controller, Event, On, Once } from '@shardix/common';
import { GuildMember, Message, Guild } from 'discord.js';

@Controller()
export class GuildEventsController {
  // Listen to new members joining
  @Event('guildMemberAdd')
  onMemberJoin(member: GuildMember) {
    console.log(`[EVENT] Member joined: ${member.user.username}`);
  }

  // Alias @On for message creation
  @On('messageCreate')
  onMessage(message: Message) {
    if (message.author.bot) return;
    console.log(`[EVENT] Message: ${message.content}`);
  }

  // Alias @Once for bot startup
  @Once('ready')
  onReady() {
    console.log('⚡ Shardix Gateway Connection Ready!');
  }
}
```

---

## ⚔️ Slash Commands (`@SlashCommand`)

Register Discord application slash commands with full metadata options:

```typescript
import { Controller, SlashCommand } from '@shardix/common';

@Controller()
export class UserCommandsController {
  @SlashCommand({
    name: 'avatar',
    description: 'Get a user avatar',
  })
  async getAvatar(interaction: any) {
    return {
      type: 4,
      data: {
        content: `Avatar URL: ${interaction.user?.avatar}`,
      },
    };
  }
}
```

---

## 🔘 Message Components (`@Button`, `@SelectMenu`, `@Modal`)

Handle interactive buttons, select dropdown menus, and modal form submissions with string IDs or Regular Expressions:

```typescript
import { Controller, Button, SelectMenu, Modal } from '@shardix/common';

@Controller()
export class UIComponentsController {
  // Handle button clicks with exact ID match
  @Button('confirm_action')
  async onConfirm(payload: any) {
    return {
      type: 4,
      data: { content: 'Action confirmed!' },
    };
  }

  // Handle buttons matching dynamic regex pattern
  @Button(/^role_toggle_(\d+)$/)
  async onRoleToggle(payload: any) {
    return {
      type: 4,
      data: { content: 'Role toggled successfully.' },
    };
  }

  // Handle Modal Form Submission
  @Modal('feedback_modal')
  async onFeedbackSubmit(payload: any) {
    return {
      type: 4,
      data: { content: 'Thank you for your feedback!' },
    };
  }
}
```

---

## 🔍 Autocomplete & Context Menus

```typescript
import { Controller, Autocomplete, ContextMenu } from '@shardix/common';

@Controller()
export class AdvancedInteractionsController {
  @Autocomplete('search', 'query')
  async onSearchQuery(payload: any) {
    return {
      type: 8,
      data: {
        choices: [
          { name: 'Option 1', value: '1' },
          { name: 'Option 2', value: '2' },
        ],
      },
    };
  }

  @ContextMenu({ name: 'User Profile', type: 'USER' })
  async onUserContextMenu(payload: any) {
    return {
      type: 4,
      data: { content: 'User Profile selected.' },
    };
  }
}
```
