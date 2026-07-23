import { Controller, SlashCommand } from '@shardix/common';
import { AutoScanner, ShardixFactory } from '@shardix/core';
import { DashboardProvider } from '@shardix/provider-dashboard';
import { HealthProvider } from '@shardix/provider-health';
import { LoggerProvider } from '@shardix/provider-logger';

@Controller()
export class OperationsController {
  @SlashCommand({ name: 'ops', description: 'Check operations status' })
  async opsStatus() {
    return {
      type: 4,
      data: {
        content: '⚡ Shardix Control Plane active! Visit http://localhost:3005 for live telemetry.',
      },
    };
  }
}

async function bootstrap() {
  const app = await ShardixFactory.create({
    autoAnalyze: false,
  });

  app
    .use(new LoggerProvider())
    .use(new HealthProvider())
    .use(new DashboardProvider({ port: 3005 }));

  AutoScanner.scanAndRegister(app, [OperationsController]);

  await app.start();
  console.log('⚡ Shardix Control Plane Dashboard active at http://localhost:3005');
}

bootstrap().catch(console.error);
