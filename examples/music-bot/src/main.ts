import { ShardixFactory, AutoScanner, VoiceConnection } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { Controller, SlashCommand, CommandContext, GuildOnly } from '@shardix/common';

@Controller()
export class MusicController {
  private activeConnections = new Map<string, VoiceConnection>();

  @SlashCommand({ name: 'play', description: 'Play audio track in voice channel' })
  @GuildOnly()
  async play(ctx: CommandContext) {
    const query = ctx.getOption<string>('query');
    const conn = new VoiceConnection(ctx.guildId || 'g1', ctx.channelId || 'c1');
    this.activeConnections.set(ctx.guildId || 'g1', conn);
    conn.player.play({ streamUrl: query });
    return ctx.reply(`🎵 Now playing: ${query}`);
  }

  @SlashCommand({ name: 'stop', description: 'Stop audio playback and leave voice channel' })
  @GuildOnly()
  async stop(ctx: CommandContext) {
    const conn = this.activeConnections.get(ctx.guildId || 'g1');
    if (conn) {
      conn.disconnect();
      this.activeConnections.delete(ctx.guildId || 'g1');
    }
    return ctx.reply('⏹ Stopped audio and left voice channel.');
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  AutoScanner.scanAndRegister(app, [MusicController]);
  await app.start();
}

bootstrap();
