# Collectors & Iteradores de Interação

O Shardix inclui um sistema de collectors assíncronos com suporte a promises, filtros de eventos e iteradores nativos `for await...of`.

---

## ⌛ Uso em Controller

```typescript
import { Controller, SlashCommand, CommandContext } from '@shardix/common';

@Controller()
export class InteractionController {
  @SlashCommand({ name: 'confirm', description: 'Confirmar ação' })
  async confirm(ctx: CommandContext) {
    await ctx.reply('Clique em confirmar abaixo:');
    const response = await ctx.awaitButton('confirm_btn', 30000);
    return ctx.editReply(`Confirmado por ${response.user.username}!`);
  }
}
```
