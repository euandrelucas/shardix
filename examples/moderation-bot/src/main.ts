import { Module } from '@shardix/common';
import { GatewayRuntime, ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { ModerationController } from './moderation.controller.js';
import { AuditLoggerService, ModerationService } from './moderation.service.js';
import { AdminGuard } from './moderation.guard.js';

@Module({
  controllers: [ModerationController],
  providers: [ModerationService, AuditLoggerService, AdminGuard],
})
export class ModerationModule {}

async function bootstrap() {
  const adapter = new DiscordJSAdapter();

  const app = await ShardixFactory.create({
    adapter,
    runtime: new GatewayRuntime({
      adapter,
      token: process.env.DISCORD_TOKEN,
    }),
  });

  app.register(ModerationModule);

  await app.start();
  console.log('🛡️ Shardix Moderation Bot running on GatewayRuntime');
}

bootstrap().catch(console.error);
