# Universal Shardix Builders

Shardix provides a full suite of fluent, decoupled builders in `@shardix/common`.

---

## 🛠️ EmbedBuilder & ButtonBuilder

```typescript
import { EmbedBuilder, ButtonBuilder, ButtonStyle, MessageBuilder } from '@shardix/common';

const embed = new EmbedBuilder()
  .setTitle('Enterprise Status')
  .setDescription('All systems operational')
  .setColor('#5865F2')
  .addField('Workers', '4 Active', true);

const button = new ButtonBuilder()
  .setCustomId('refresh_status')
  .setLabel('Refresh')
  .setStyle(ButtonStyle.Primary);

const message = new MessageBuilder()
  .addEmbeds(embed)
  .addComponents(button);
```

---

## 📋 Available Builders

- `EmbedBuilder`
- `ButtonBuilder`
- `SelectMenuBuilder`
- `ModalBuilder`
- `PollBuilder`
- `ActionRowBuilder`
- `SlashCommandBuilder`
- `ContextMenuBuilder`
- `AttachmentBuilder`
- `RoleBuilder`
- `ThreadBuilder`
