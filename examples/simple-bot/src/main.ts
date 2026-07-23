import { ShardixFactory, AutoScanner } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { Controller, SlashCommand, On } from '@shardix/common';

@Controller()
export class PingController {
  @SlashCommand({ name: 'ping', description: 'Replies with Pong!' })
  async ping() {
    return { type: 4, data: { content: '🏓 Pong from Simple Bot!' } };
  }

  @On('ready')
  onReady() {
    console.log('⚡ Simple Bot Ready!');
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  AutoScanner.scanAndRegister(app, [PingController]);

  await app.start();
}

bootstrap();
