# Builders Universais do Shardix

O Shardix fornece uma suíte completa de builders fluentes e desacoplados no pacote `@shardix/common`.

---

## 🛠️ EmbedBuilder & ButtonBuilder

```typescript
import { EmbedBuilder, ButtonBuilder, ButtonStyle, MessageBuilder } from '@shardix/common';

const embed = new EmbedBuilder()
  .setTitle('Status do Sistema')
  .setDescription('Todos os sistemas operacionais')
  .setColor('#5865F2')
  .addField('Workers', '4 Ativos', true);

const button = new ButtonBuilder()
  .setCustomId('refresh_status')
  .setLabel('Atualizar')
  .setStyle(ButtonStyle.Primary);

const message = new MessageBuilder()
  .addEmbeds(embed)
  .addComponents(button);
```
