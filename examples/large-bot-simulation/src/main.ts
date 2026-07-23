import { Controller, Injectable, SlashCommand } from '@shardix/common';
import { AutoScanner, ShardixFactory } from '@shardix/core';

function createLargeScaleEntities() {
  const providers: any[] = [];
  const controllers: any[] = [];

  for (let i = 0; i < 100; i++) {
    @Injectable()
    class DynamicProvider {
      public id = i;
    }
    providers.push(DynamicProvider);
  }

  for (let c = 0; c < 50; c++) {
    @Controller()
    class DynamicController {
      @SlashCommand({ name: `cmd_${c}_1`, description: 'cmd 1' })
      cmd1() { return 'ok'; }

      @SlashCommand({ name: `cmd_${c}_2`, description: 'cmd 2' })
      cmd2() { return 'ok'; }

      @SlashCommand({ name: `cmd_${c}_3`, description: 'cmd 3' })
      cmd3() { return 'ok'; }

      @SlashCommand({ name: `cmd_${c}_4`, description: 'cmd 4' })
      cmd4() { return 'ok'; }

      @SlashCommand({ name: `cmd_${c}_5`, description: 'cmd 5' })
      cmd5() { return 'ok'; }
    }
    controllers.push(DynamicController);
  }

  return { providers, controllers };
}

async function bootstrap() {
  console.log('🚀 Starting Large Bot Scale Simulation (50 Controllers, 250 Commands, 100 Providers)...');
  const initialMemory = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  const app = await ShardixFactory.create({ autoAnalyze: false });

  const { providers, controllers } = createLargeScaleEntities();

  AutoScanner.scanAndRegister(app, [...providers, ...controllers]);

  await app.start();

  const endTime = performance.now();
  const finalMemory = process.memoryUsage().heapUsed;

  const bootTimeMs = (endTime - startTime).toFixed(2);
  const memoryUsedMB = ((finalMemory - initialMemory) / 1024 / 1024).toFixed(2);

  console.log(`✅ Simulation Completed Successfully!`);
  console.log(`⏱️ Boot Time: ${bootTimeMs} ms`);
  console.log(`💾 Heap Allocated: ${memoryUsedMB} MB`);
}

bootstrap().catch(console.error);
