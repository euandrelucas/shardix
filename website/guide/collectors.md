# Collectors & Interaction Iterators

Shardix includes an async collector system supporting promises, event filtering, and native `for await...of` async iterators.

---

## ⌛ Usage in Controller

```typescript
import { Controller, SlashCommand, CommandContext } from '@shardix/common';

@Controller()
export class InteractionController {
  @SlashCommand({ name: 'confirm', description: 'Confirm action' })
  async confirm(ctx: CommandContext) {
    await ctx.reply('Click confirm below:');
    const response = await ctx.awaitButton('confirm_btn', 30000);
    return ctx.editReply(`Confirmed by ${response.user.username}!`);
  }
}
```
