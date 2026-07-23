import { Controller, SlashCommand } from '@shardix/common';
import { AutoScanner, ShardixFactory } from '@shardix/core';
import { DiscordjsAdapter } from '@shardix/discordjs';
import { ErisAdapter } from '@shardix/eris';
import { OceanicAdapter } from '@shardix/oceanicjs';
import { DiscordenoAdapter } from '@shardix/discordeno';

@Controller()
export class PingController {
  @SlashCommand({ name: 'ping', description: 'Check bot latency across any Discord library adapter' })
  async ping() {
    return {
      type: 4,
      data: {
        content: '🏓 Pong! Shardix operating seamlessly with ZERO Vendor Lock-in!',
      },
    };
  }
}

async function bootstrap() {
  // Choose ANY adapter: DiscordjsAdapter | ErisAdapter | OceanicAdapter | DiscordenoAdapter
  const chosenAdapterType = process.env.DISCORD_LIB || 'discordjs';
  let adapter;

  switch (chosenAdapterType) {
    case 'eris':
      adapter = new ErisAdapter();
      break;
    case 'oceanicjs':
      adapter = new OceanicAdapter();
      break;
    case 'discordeno':
      adapter = new DiscordenoAdapter();
      break;
    case 'discordjs':
    default:
      adapter = new DiscordjsAdapter();
      break;
  }

  const app = await ShardixFactory.create({
    adapter,
    autoAnalyze: false,
  });

  AutoScanner.scanAndRegister(app, [PingController]);

  console.log(`🚀 Shardix Application initialized using Adapter: ${adapter.name}`);
}

bootstrap().catch(console.error);
