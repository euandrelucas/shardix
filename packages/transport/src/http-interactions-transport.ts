import { InteractionHandler, Transport } from '@shardix/common';
import { HttpOptions, HttpServer } from '@shardix/http';

export class HttpInteractionsTransport implements Transport {
  public readonly name = 'HttpInteractionsTransport';
  private server: HttpServer;

  constructor(options: HttpOptions = {}) {
    this.server = new HttpServer(options);
  }

  public async listen(handler: InteractionHandler): Promise<void> {
    this.server.registerInteractionEndpoint(handler);
    await this.server.start();
  }

  public async close(): Promise<void> {
    await this.server.stop();
  }
}
