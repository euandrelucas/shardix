# Events & Unified Context

Shardix provides a unified way to handle Discord events using decorators, completely abstracting the underlying library.

## Event Decorators

### `@On(eventName)` — Persistent listener

```typescript
import { Controller, On } from '@shardix/common';

@Controller()
export class EventsController {
  @On('messageCreate')
  async onMessage(message: any) {
    if (message.content === 'hello') {
      await message.reply('Hello! 👋');
    }
  }

  @On('guildMemberAdd')
  async onMemberJoin(member: any) {
    console.log(`${member.user.username} joined the server!`);
  }

  @On('guildMemberRemove')
  async onMemberLeave(member: any) {
    console.log(`${member.user.username} left the server.`);
  }

  @On('ready')
  async onReady(client: any) {
    console.log(`✅ Logged in as ${client.user.tag}`);
    // Set bot status
    client.user.setPresence({
      activities: [{ name: 'with Shardix', type: 0 }],
      status: 'online',
    });
  }
}
```

### `@Once(eventName)` — One-time listener

```typescript
@Once('ready')
async onFirstReady(client: any) {
  // Only fires ONCE when the bot first connects
  console.log('Bot is ready for the first time!');
  await this.registerSlashCommands();
}
```

## CommandContext

Every slash command, button, modal, and select menu handler receives a `CommandContext` as its first argument:

```typescript
@SlashCommand({ name: 'example', description: 'Example command' })
async example(ctx: CommandContext) {
  // User information
  console.log(ctx.user.id);
  console.log(ctx.user.username);

  // Guild information
  console.log(ctx.guildId);   // undefined in DMs
  console.log(ctx.channelId);

  // Member information (guild only)
  console.log(ctx.member?.roles);
  console.log(ctx.member?.permissions);

  // The raw interaction payload
  console.log(ctx.raw);

  // Get command options
  const name = ctx.getOption<string>('name');
  const count = ctx.getOption<number>('count');

  // Get all options as a map
  const { name, count } = ctx.getOptions();

  // Reply to the interaction
  return ctx.reply('Hello World!');
}
```

### Replying to Interactions

```typescript
// Simple text reply
return ctx.reply('Hello!');

// Rich reply with embeds
return ctx.reply({
  content: 'Check this out!',
  embeds: [embed.toJSON()],
  components: [row.toJSON()],
});

// Ephemeral reply (only visible to the command user)
return ctx.reply({
  content: 'This is only visible to you!',
  ephemeral: true,
});

// Defer response (shows loading indicator)
await ctx.defer();
// ... do long operation ...
return ctx.editReply('Finished!');

// Deferred ephemeral
await ctx.defer(true); // true = ephemeral
await doLongOperation();
return ctx.editReply('Done!');

// Follow-up messages
await ctx.reply('Processing...');
await ctx.followUp('Step 1 done!');
await ctx.followUp('Step 2 done!');
```

### Awaiting Components

Wait for a button click, modal, or select menu after sending a message:

```typescript
@SlashCommand({ name: 'confirm', description: 'Confirm something' })
async confirm(ctx: CommandContext) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('yes').setLabel('Yes').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('no').setLabel('No').setStyle(ButtonStyle.Danger),
  );

  await ctx.reply({
    content: 'Are you sure?',
    components: [row.toJSON()],
  });

  // Wait for a button click (30 second timeout)
  const buttonCtx = await ctx.awaitButton('yes', 30000);
  if (!buttonCtx) {
    return ctx.editReply({ content: 'Timed out.', components: [] });
  }

  return buttonCtx.reply({ content: '✅ Confirmed!', ephemeral: true });
}
```

## Available Discord Events

All standard Discord events are supported:

| Event | Description |
|-------|-------------|
| `ready` | Bot is connected and ready |
| `messageCreate` | Message sent in a channel |
| `messageUpdate` | Message edited |
| `messageDelete` | Message deleted |
| `guildMemberAdd` | User joined a server |
| `guildMemberRemove` | User left a server |
| `guildMemberUpdate` | Server member updated |
| `guildCreate` | Bot added to a server |
| `guildDelete` | Bot removed from a server |
| `channelCreate` | Channel created |
| `channelDelete` | Channel deleted |
| `roleCreate` | Role created |
| `roleDelete` | Role deleted |
| `voiceStateUpdate` | User joined/left voice channel |
| `presenceUpdate` | User's presence changed |
| `typingStart` | User started typing |
| `interactionCreate` | Any interaction (handled automatically by Shardix) |
