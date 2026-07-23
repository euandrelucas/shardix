import { AutoScanner, HttpRuntime, ShardixFactory } from '@shardix/core';
import { PingController, PingService } from './ping.controller.js';

async function bootstrap() {
  const app = await ShardixFactory.create({
    runtime: new HttpRuntime({
      port: 3001,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
    }),
  });

  // Zero manual module registration using AutoScanner
  AutoScanner.scanAndRegister(app, [PingController, PingService]);

  await app.start();
  console.log('⚡ Shardix Ping Bot running on HttpRuntime at port 3001');
}

bootstrap().catch(console.error);
