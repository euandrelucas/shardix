# Universal Builders

Shardix provides framework-agnostic builders for all Discord message components. These work identically regardless of which adapter you use.

## EmbedBuilder

```typescript
import { EmbedBuilder } from '@shardix/common';

const embed = new EmbedBuilder()
  .setTitle('🏓 Pong!')
  .setDescription('Bot is online and responding.')
  .setColor(0x5865f2)          // Discord blurple
  .setColor('#5865F2')         // Also accepts hex strings
  .setUrl('https://example.com')
  .setTimestamp()
  .setTimestamp(new Date())
  .setAuthor({
    name: 'Shardix Bot',
    icon_url: 'https://example.com/avatar.png',
    url: 'https://shardix.dev',
  })
  .setFooter({
    text: 'Powered by Shardix',
    icon_url: 'https://example.com/icon.png',
  })
  .setImage('https://example.com/banner.png')
  .setThumbnail('https://example.com/thumb.png')
  .addField('Field Name', 'Field Value')
  .addField('Inline Field', 'Value', true)  // inline = true
  .addField('Another Inline', 'Value', true);

// Use in ctx.reply:
return ctx.reply({ embeds: [embed.toJSON()] });
```

## ButtonBuilder

```typescript
import { ButtonBuilder, ButtonStyle } from '@shardix/common';

// Primary button
const primary = new ButtonBuilder()
  .setCustomId('my_button')
  .setLabel('Click Me!')
  .setStyle(ButtonStyle.Primary);

// Danger button
const danger = new ButtonBuilder()
  .setCustomId('delete_btn')
  .setLabel('Delete')
  .setStyle(ButtonStyle.Danger);

// Link button (no customId)
const link = new ButtonBuilder()
  .setUrl('https://shardix.dev')
  .setLabel('Visit Website')
  .setStyle(ButtonStyle.Link);

// With emoji
const withEmoji = new ButtonBuilder()
  .setCustomId('star_btn')
  .setLabel('Star')
  .setStyle(ButtonStyle.Primary)
  .setEmoji({ name: '⭐' });

// Disabled button
const disabled = new ButtonBuilder()
  .setCustomId('disabled_btn')
  .setLabel('Disabled')
  .setStyle(ButtonStyle.Secondary)
  .setDisabled(true);
```

**Button Styles:**
| Style | Value | Color |
|-------|-------|-------|
| `Primary` | 1 | Blue |
| `Secondary` | 2 | Gray |
| `Success` | 3 | Green |
| `Danger` | 4 | Red |
| `Link` | 5 | Gray (opens URL) |

## ActionRowBuilder

Components must be wrapped in an `ActionRowBuilder` (max 5 buttons per row, max 5 rows per message):

```typescript
import { ActionRowBuilder } from '@shardix/common';

const row1 = new ActionRowBuilder()
  .addComponents(primaryBtn, successBtn, dangerBtn);

const row2 = new ActionRowBuilder()
  .addComponents(linkBtn);

return ctx.reply({
  content: 'Choose an option:',
  components: [row1.toJSON(), row2.toJSON()],
});
```

## SelectMenuBuilder

```typescript
import { SelectMenuBuilder } from '@shardix/common';

const select = new SelectMenuBuilder()
  .setCustomId('color_select')
  .setPlaceholder('Choose a color...')
  .addOptions([
    { label: 'Red', value: 'red', description: 'A warm color', emoji: '🔴' },
    { label: 'Blue', value: 'blue', description: 'A cool color', emoji: '🔵' },
    { label: 'Green', value: 'green', description: 'A natural color', emoji: '🟢' },
  ])
  .setMinValues(1)
  .setMaxValues(2);

const row = new ActionRowBuilder().addComponents(select);

return ctx.reply({ components: [row.toJSON()] });
```

## ModalBuilder

```typescript
import { ModalBuilder } from '@shardix/common';

const modal = new ModalBuilder()
  .setCustomId('feedback_modal')
  .setTitle('Submit Feedback')
  .addTextInput({
    custom_id: 'feedback_text',
    label: 'Your Feedback',
    style: 1, // 1 = Short, 2 = Paragraph
    placeholder: 'Tell us what you think...',
    required: true,
    max_length: 500,
  });

// Show modal to user
return ctx.reply(modal.toJSON());
```

## MessageBuilder

```typescript
import { MessageBuilder } from '@shardix/common';

const message = new MessageBuilder()
  .setContent('Hello World!')
  .addEmbed(embed)
  .addComponent(row)
  .setEphemeral(true)
  .setTTS(false);

return ctx.reply(message.toJSON());
```

## PollBuilder

```typescript
import { PollBuilder } from '@shardix/common';

const poll = new PollBuilder()
  .setQuestion('What is your favorite color?')
  .addAnswer('Red', '🔴')
  .addAnswer('Blue', '🔵')
  .addAnswer('Green', '🟢')
  .setDuration(24) // hours
  .setMultiSelect(false);

return ctx.reply({ poll: poll.toJSON() });
```

## SlashCommandBuilder (for registration)

```typescript
import { SlashCommandBuilder } from '@shardix/common';

const command = new SlashCommandBuilder()
  .setName('greet')
  .setDescription('Greet someone')
  .addStringOption(opt => {
    opt.name = 'name';
    opt.description = 'Person to greet';
    opt.required = true;
    return opt;
  });

// Use in register-commands.ts
const commands = [command.toJSON()];
```

## PermissionBuilder

```typescript
import { PermissionBuilder } from '@shardix/common';

const perms = new PermissionBuilder()
  .add(8n)    // ADMINISTRATOR
  .add(32n)   // MANAGE_CHANNELS
  .remove(8n) // Remove ADMINISTRATOR;

console.log(perms.toString()); // '32'
```
