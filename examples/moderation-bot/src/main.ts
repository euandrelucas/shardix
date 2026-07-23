import { ShardixFactory, AutoScanner } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { Controller, SlashCommand, CommandContext, GuildOnly, Permissions } from '@shardix/common';

@Controller()
export class ModerationController {
  @SlashCommand({ name: 'ban', description: 'Ban a member from the guild' })
  @GuildOnly()
  @Permissions('BanMembers')
  async ban(ctx: CommandContext) {
    const userId = ctx.getOption<string>('user');
    const reason = ctx.getOption<string>('reason') || 'Violation of server rules';
    return ctx.reply(`🔨 Banned member ${userId} for reason: ${reason}`);
  }

  @SlashCommand({ name: 'kick', description: 'Kick a member from the guild' })
  @GuildOnly()
  @Permissions('KickMembers')
  async kick(ctx: CommandContext) {
    const userId = ctx.getOption<string>('user');
    return ctx.reply(`👢 Kicked member ${userId}`);
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  AutoScanner.scanAndRegister(app, [ModerationController]);
  await app.start();
}

bootstrap();
