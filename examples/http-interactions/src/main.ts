import { ShardixFactory } from '@shardix/core';
import { HttpInteractionsTransport } from '@shardix/transport';
import { AppModule } from './app.controller.js';

async function bootstrap() {
  const app = await ShardixFactory.create({
    transport: new HttpInteractionsTransport({
      port: 3000,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
    }),
  });

  app.register(AppModule);

  await app.start();
  console.log('Shardix HTTP Interactions application is listening on port 3000');
}

bootstrap().catch(console.error);
