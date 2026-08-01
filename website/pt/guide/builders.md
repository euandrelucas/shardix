# Builders Universais

O Shardix fornece builders agnósticos de framework para todos os componentes de mensagem do Discord. Eles funcionam identicamente independentemente do adapter utilizado.

## EmbedBuilder

```typescript
import { EmbedBuilder } from '@shardix/common';

const embed = new EmbedBuilder()
  .setTitle('🏓 Pong!')
  .setDescription('Bot está online e respondendo.')
  .setColor(0x5865f2)          // Discord blurple
  .setColor('#5865F2')         // Também aceita strings hex
  .setUrl('https://exemplo.com')
  .setTimestamp()
  .setTimestamp(new Date())
  .setAuthor({
    name: 'Shardix Bot',
    icon_url: 'https://exemplo.com/avatar.png',
    url: 'https://shardix.dev',
  })
  .setFooter({
    text: 'Powered by Shardix',
    icon_url: 'https://exemplo.com/icon.png',
  })
  .setImage('https://exemplo.com/banner.png')
  .setThumbnail('https://exemplo.com/thumb.png')
  .addField('Nome do Campo', 'Valor do Campo')
  .addField('Campo Inline', 'Valor', true)  // inline = true
  .addField('Outro Inline', 'Valor', true);

// Usar no ctx.reply:
return ctx.reply({ embeds: [embed.toJSON()] });
```

## ButtonBuilder

```typescript
import { ButtonBuilder, ButtonStyle } from '@shardix/common';

// Botão primário
const primario = new ButtonBuilder()
  .setCustomId('meu_botao')
  .setLabel('Clique Aqui!')
  .setStyle(ButtonStyle.Primary);

// Botão de perigo
const perigo = new ButtonBuilder()
  .setCustomId('btn_deletar')
  .setLabel('Deletar')
  .setStyle(ButtonStyle.Danger);

// Botão de link (sem customId)
const link = new ButtonBuilder()
  .setUrl('https://shardix.dev')
  .setLabel('Visitar Website')
  .setStyle(ButtonStyle.Link);

// Com emoji
const comEmoji = new ButtonBuilder()
  .setCustomId('btn_estrela')
  .setLabel('Estrela')
  .setStyle(ButtonStyle.Primary)
  .setEmoji({ name: '⭐' });

// Botão desabilitado
const desabilitado = new ButtonBuilder()
  .setCustomId('btn_desabilitado')
  .setLabel('Desabilitado')
  .setStyle(ButtonStyle.Secondary)
  .setDisabled(true);
```

**Estilos de Botão:**
| Estilo | Valor | Cor |
|-------|-------|-------|
| `Primary` | 1 | Azul |
| `Secondary` | 2 | Cinza |
| `Success` | 3 | Verde |
| `Danger` | 4 | Vermelho |
| `Link` | 5 | Cinza (abre URL) |

## ActionRowBuilder

Componentes devem ser envolvidos em um `ActionRowBuilder` (máx 5 botões por linha, máx 5 linhas por mensagem):

```typescript
import { ActionRowBuilder } from '@shardix/common';

const linha1 = new ActionRowBuilder()
  .addComponents(btnPrimario, btnSucesso, btnPerigo);

const linha2 = new ActionRowBuilder()
  .addComponents(btnLink);

return ctx.reply({
  content: 'Escolha uma opção:',
  components: [linha1.toJSON(), linha2.toJSON()],
});
```

## SelectMenuBuilder

```typescript
import { SelectMenuBuilder } from '@shardix/common';

const select = new SelectMenuBuilder()
  .setCustomId('selecionar_cor')
  .setPlaceholder('Escolha uma cor...')
  .addOptions([
    { label: 'Vermelho', value: 'vermelho', description: 'Uma cor quente', emoji: '🔴' },
    { label: 'Azul', value: 'azul', description: 'Uma cor fria', emoji: '🔵' },
    { label: 'Verde', value: 'verde', description: 'Uma cor natural', emoji: '🟢' },
  ])
  .setMinValues(1)
  .setMaxValues(2);

const linha = new ActionRowBuilder().addComponents(select);

return ctx.reply({ components: [linha.toJSON()] });
```

## ModalBuilder

```typescript
import { ModalBuilder } from '@shardix/common';

const modal = new ModalBuilder()
  .setCustomId('modal_feedback')
  .setTitle('Enviar Feedback')
  .addTextInput({
    custom_id: 'texto_feedback',
    label: 'Seu Feedback',
    style: 1, // 1 = Curto, 2 = Parágrafo
    placeholder: 'Nos diga o que você acha...',
    required: true,
    max_length: 500,
  });

// Mostrar modal ao usuário
return ctx.reply(modal.toJSON());
```

## MessageBuilder

```typescript
import { MessageBuilder } from '@shardix/common';

const mensagem = new MessageBuilder()
  .setContent('Olá Mundo!')
  .addEmbed(embed)
  .addComponent(linha)
  .setEphemeral(true)
  .setTTS(false);

return ctx.reply(mensagem.toJSON());
```

## SlashCommandBuilder (para registro)

```typescript
import { SlashCommandBuilder } from '@shardix/common';

const comando = new SlashCommandBuilder()
  .setName('saudar')
  .setDescription('Cumprimentar alguém')
  .addStringOption(opt => {
    opt.name = 'nome';
    opt.description = 'Pessoa para cumprimentar';
    opt.required = true;
    return opt;
  });

// Usar no register-commands.ts
const commands = [comando.toJSON()];
```
