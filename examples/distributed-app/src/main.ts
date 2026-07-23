import { Controller, SlashCommand } from '@shardix/common';
import { AutoScanner, ShardixFactory } from '@shardix/core';
import { DistributedRuntime } from '@shardix/runtime-distributed';
import { QueueProvider, QueueService } from '@shardix/provider-queue';
import { ObservabilityProvider, ObservabilityService } from '@shardix/provider-observability';

@Controller()
export class DistributedTaskController {
  constructor(
    private queue: QueueService,
    private obs: ObservabilityService
  ) {}

  @SlashCommand({ name: 'dispatch', description: 'Dispatch heavy background job' })
  async dispatchJob() {
    this.obs.recordCommand();
    await this.queue.add('renderImage', { prompt: 'Cyberpunk Bot' });
    return {
      type: 4,
      data: {
        content: 'Job queued successfully across worker cluster! ⚙️',
      },
    };
  }
}

async function bootstrap() {
  const runtime = new DistributedRuntime({ workerCount: 4 });

  const app = await ShardixFactory.create({
    runtime,
    autoAnalyze: false,
  });

  app.use(new QueueProvider()).use(new ObservabilityProvider());

  AutoScanner.scanAndRegister(app, [DistributedTaskController]);

  await app.start();
  console.log('⚡ Shardix Distributed Application running across 4 Workers with Queues & Observability!');
}

bootstrap().catch(console.error);
