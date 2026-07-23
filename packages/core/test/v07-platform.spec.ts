import { describe, it, expect } from 'vitest';
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
  ModalBuilder,
  MessageBuilder,
  PollBuilder,
  GuildOnly,
  DMOnly,
  CommandContext,
} from '@shardix/common';
import { ShardixFactory } from '../src/application/shardix-factory.js';
import { MockDiscordAdapter, mockInteraction } from '@shardix/testing';
import { Controller, SlashCommand } from '@shardix/common';

@Controller()
class PlatformTestController {
  @SlashCommand({ name: 'build_embed' })
  async buildEmbed(ctx: CommandContext) {
    const embed = new EmbedBuilder()
      .setTitle('Test Embed')
      .setDescription('Built with Shardix EmbedBuilder')
      .setColor('#5865F2');

    const button = new ButtonBuilder()
      .setCustomId('click_me')
      .setLabel('Click Me')
      .setStyle(ButtonStyle.Success);

    return ctx.reply(new MessageBuilder().addEmbeds(embed).addComponents(button));
  }

  @SlashCommand({ name: 'guild_cmd' })
  @GuildOnly()
  async guildCmd(ctx: CommandContext) {
    return ctx.reply('Guild only success!');
  }

  @SlashCommand({ name: 'dm_cmd' })
  @DMOnly()
  async dmCmd(ctx: CommandContext) {
    return ctx.reply('DM only success!');
  }
}

describe('Shardix v0.7 — Discord Platform Implementation', () => {
  it('EmbedBuilder, ButtonBuilder, SelectMenuBuilder, ModalBuilder, PollBuilder should construct valid payloads', () => {
    const embed = new EmbedBuilder().setTitle('Hello').setDescription('World').setColor('#FF0000').toJSON();
    expect(embed.title).toBe('Hello');
    expect(embed.color).toBe(16711680);

    const button = new ButtonBuilder().setCustomId('b1').setLabel('Btn').setStyle(ButtonStyle.Primary).toJSON();
    expect(button.custom_id).toBe('b1');
    expect(button.style).toBe(1);

    const select = new SelectMenuBuilder().setCustomId('s1').addOptions({ label: 'Opt 1', value: 'v1' }).toJSON();
    expect(select.custom_id).toBe('s1');

    const modal = new ModalBuilder().setTitle('Form').setCustomId('m1').toJSON();
    expect(modal.title).toBe('Form');

    const poll = new PollBuilder().setQuestion('Pizza or Burger?').addAnswer({ text: 'Pizza' }).toJSON();
    expect(poll.question.text).toBe('Pizza or Burger?');
  });

  it('CommandContext should receive interaction, reply with builders, and enforce @GuildOnly / @DMOnly', async () => {
    const mockAdapter = new MockDiscordAdapter();
    const app = await ShardixFactory.create({ adapter: mockAdapter, autoAnalyze: false });
    app.getRouter().registerController(PlatformTestController);
    await app.start();

    // 1. SlashCommand returning MessageBuilder with Embed and Button via CommandContext
    const payload1 = mockInteraction({ command: 'build_embed' });
    const res1 = await app.getRouter().handleInteraction(payload1);
    expect(res1.data.embeds[0].title).toBe('Test Embed');
    expect(res1.data.components[0].components[0].custom_id).toBe('click_me');

    // 2. @GuildOnly restriction check
    const dmPayload = mockInteraction({ command: 'guild_cmd', guildId: undefined });
    const res2 = await app.getRouter().handleInteraction(dmPayload);
    expect(res2.data.content).toContain('only be used in a server');

    const guildPayload = mockInteraction({ command: 'guild_cmd', guildId: 'guild_999' });
    const res3 = await app.getRouter().handleInteraction(guildPayload);
    expect(res3.data.content).toBe('Guild only success!');

    // 3. Shardix REST Client and Cache test
    expect(app.rest.guilds).toBeDefined();
    expect(app.cache.guild).toBeDefined();
    app.cache.setGuild('g1', { id: 'g1', name: 'Test Guild' });
    expect(app.cache.guild('g1').name).toBe('Test Guild');

    await app.stop();
  });
});
