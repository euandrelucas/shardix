import { Controller, Event, Module, SlashCommand } from '@shardix/common';
import { HybridRuntime, ShardixFactory } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';

@Controller()
export class HybridController {
  @SlashCommand({ name: 'status', description: 'Check bot status' })
  async status() {
    return { type: 4, data: { content: 'Hybrid Bot operating nominally ⚡' } };
  }

  @Event('ready')
  onReady() {
    console.log('[HYBRID BOT] Connected to Gateway WS successfully!');
  }
}

@Module({
  controllers: [HybridController],
})
export class HybridAppModule {}

async function bootstrap() {
  const adapter = new DiscordJSAdapter();

  const app = await ShardixFactory.create({
    adapter,
    runtime: new HybridRuntime({
      gateway: {
        adapter,
        token: process.env.DISCORD_TOKEN,
      },
      http: {
        port: 3002,
        publicKey: process.env.DISCORD_PUBLIC_KEY,
      },
    }),
  });

  app.register(HybridAppModule);

  await app.start();
  console.log('🔄 Shardix Hybrid Bot started (Gateway WS + HTTP Interactions on port 3002)');
}

bootstrap().catch(console.error);
