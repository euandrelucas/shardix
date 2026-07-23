import { Controller, SlashCommand } from '@shardix/common';
import { AutoScanner, HttpRuntime, ShardixFactory } from '@shardix/core';
import { ConfigProvider } from '@shardix/provider-config';
import { LoggerProvider } from '@shardix/provider-logger';
import { CacheProvider } from '@shardix/provider-cache';
import { EventBusProvider } from '@shardix/provider-eventbus';
import { HealthProvider } from '@shardix/provider-health';

@Controller()
export class SystemController {
  @SlashCommand({ name: 'health', description: 'Check ecosystem health status' })
  async health() {
    return {
      type: 4,
      data: {
        content: 'Ecosystem App operating with 100% Official Providers! 🌟',
      },
    };
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    runtime: new HttpRuntime({ port: 3003 }),
  });

  // Register Official Providers via app.use()
  app
    .use(new ConfigProvider())
    .use(new LoggerProvider({ context: 'EcosystemApp', pretty: true }))
    .use(new CacheProvider())
    .use(new EventBusProvider())
    .use(new HealthProvider());

  AutoScanner.scanAndRegister(app, [SystemController]);

  await app.start();
  console.log('🚀 Shardix Ecosystem App running on port 3003 with 5 Official Providers!');
}

bootstrap().catch(console.error);
