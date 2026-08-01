# Eventos e Contexto Unificado

O Shardix oferece uma forma unificada de manipular eventos do Discord usando decorators, abstraindo completamente a biblioteca subjacente.

## Decorators de Evento

### `@On(nomeEvento)` — Listener persistente

```typescript
import { Controller, On } from '@shardix/common';

@Controller()
export class EventsController {
  @On('messageCreate')
  async aoReceberMensagem(message: any) {
    if (message.content === 'ola') {
      await message.reply('Olá! 👋');
    }
  }

  @On('guildMemberAdd')
  async aoMembroEntrar(member: any) {
    console.log(`${member.user.username} entrou no servidor!`);
  }

  @On('guildMemberRemove')
  async aoMembroSair(member: any) {
    console.log(`${member.user.username} saiu do servidor.`);
  }

  @On('ready')
  async aoPronto(client: any) {
    console.log(`✅ Conectado como ${client.user.tag}`);
    // Definir status do bot
    client.user.setPresence({
      activities: [{ name: 'com Shardix', type: 0 }],
      status: 'online',
    });
  }
}
```

### `@Once(nomeEvento)` — Listener de uma única vez

```typescript
@Once('ready')
async aoPrimeiroPronto(client: any) {
  // Dispara APENAS UMA VEZ quando o bot se conecta pela primeira vez
  console.log('Bot está pronto pela primeira vez!');
  await this.registrarSlashCommands();
}
```

## CommandContext

Todo handler de slash command, botão, modal e select menu recebe um `CommandContext` como primeiro argumento:

```typescript
@SlashCommand({ name: 'exemplo', description: 'Comando de exemplo' })
async exemplo(ctx: CommandContext) {
  // Informações do usuário
  console.log(ctx.user.id);
  console.log(ctx.user.username);

  // Informações do servidor
  console.log(ctx.guildId);   // undefined em DMs
  console.log(ctx.channelId);

  // Informações do membro (apenas em servidores)
  console.log(ctx.member?.roles);
  console.log(ctx.member?.permissions);

  // O payload da interação bruta
  console.log(ctx.raw);

  // Obter opções do comando
  const nome = ctx.getOption<string>('nome');
  const contagem = ctx.getOption<number>('contagem');

  // Obter todas as opções como mapa
  const { nome, contagem } = ctx.getOptions();

  // Responder à interação
  return ctx.reply('Olá Mundo!');
}
```

### Respondendo a Interações

```typescript
// Resposta simples de texto
return ctx.reply('Olá!');

// Resposta rica com embeds
return ctx.reply({
  content: 'Confira isso!',
  embeds: [embed.toJSON()],
  components: [linha.toJSON()],
});

// Resposta ephemeral (visível apenas para quem executou o comando)
return ctx.reply({
  content: 'Isso só é visível para você!',
  ephemeral: true,
});

// Resposta diferida (mostra indicador de carregamento)
await ctx.defer();
// ... fazer operação longa ...
return ctx.editReply('Concluído!');

// Diferido ephemeral
await ctx.defer(true); // true = ephemeral
await fazerOperacaoLonga();
return ctx.editReply('Pronto!');

// Mensagens de acompanhamento
await ctx.reply('Processando...');
await ctx.followUp('Passo 1 concluído!');
await ctx.followUp('Passo 2 concluído!');
```

### Aguardando Componentes

Aguarde um clique de botão, modal ou seleção de menu após enviar uma mensagem:

```typescript
@SlashCommand({ name: 'confirmar', description: 'Confirmar algo' })
async confirmar(ctx: CommandContext) {
  const linha = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('sim').setLabel('Sim').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('nao').setLabel('Não').setStyle(ButtonStyle.Danger),
  );

  await ctx.reply({
    content: 'Tem certeza?',
    components: [linha.toJSON()],
  });

  // Aguardar clique no botão (timeout de 30 segundos)
  const btnCtx = await ctx.awaitButton('sim', 30000);
  if (!btnCtx) {
    return ctx.editReply({ content: 'Tempo esgotado.', components: [] });
  }

  return btnCtx.reply({ content: '✅ Confirmado!', ephemeral: true });
}
```

## Eventos Discord Disponíveis

Todos os eventos Discord padrão são suportados:

| Evento | Descrição |
|-------|-------------|
| `ready` | Bot conectado e pronto |
| `messageCreate` | Mensagem enviada em um canal |
| `messageUpdate` | Mensagem editada |
| `messageDelete` | Mensagem deletada |
| `guildMemberAdd` | Usuário entrou em um servidor |
| `guildMemberRemove` | Usuário saiu de um servidor |
| `guildMemberUpdate` | Membro do servidor atualizado |
| `guildCreate` | Bot adicionado a um servidor |
| `guildDelete` | Bot removido de um servidor |
| `channelCreate` | Canal criado |
| `channelDelete` | Canal deletado |
| `roleCreate` | Cargo criado |
| `roleDelete` | Cargo deletado |
| `voiceStateUpdate` | Usuário entrou/saiu do canal de voz |
| `presenceUpdate` | Presença do usuário alterada |
| `typingStart` | Usuário começou a digitar |
| `interactionCreate` | Qualquer interação (manipulada automaticamente pelo Shardix) |
