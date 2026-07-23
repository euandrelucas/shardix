import { ShardixFactory, AutoScanner } from '@shardix/core';
import { DiscordJSAdapter } from '@shardix/discordjs';
import { Controller, SlashCommand, Injectable, Module, RateLimit } from '@shardix/common';
import { DashboardProvider } from '@shardix/provider-dashboard';

@Injectable()
export class EconomyService {
  async getBalance(userId: string) {
    return 1000;
  }
}

@Controller()
export class EconomyController {
  constructor(private economyService: EconomyService) {}

  @SlashCommand({ name: 'balance', description: 'Check your coins balance' })
  @RateLimit({ limit: 3, window: '1m' })
  async balance(interaction: any) {
    const coins = await this.economyService.getBalance(interaction.user?.id || '123');
    return { type: 4, data: { content: `💰 Your balance: ${coins} coins.` } };
  }
}

@Module({
  providers: [EconomyService],
  controllers: [EconomyController],
})
export class EconomyModule {}

@Module({
  imports: [EconomyModule],
})
export class AppModule {}

async function bootstrap() {
  const app = await ShardixFactory.create({
    adapter: new DiscordJSAdapter(),
  });

  app.use(new DashboardProvider({ port: 3005 }));
  app.register(AppModule);

  await app.start();
  console.log('🚀 Large Enterprise Modular Bot running!');
}

bootstrap();
