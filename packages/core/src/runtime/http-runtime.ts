import { BaseRuntime } from './runtime.js';
import { HttpInteractionsTransport } from '@shardix/transport';
import { HttpOptions } from '@shardix/http';

export class HttpRuntime extends BaseRuntime {
  public readonly name = 'HttpRuntime';
  private transport: HttpInteractionsTransport;

  constructor(options: HttpOptions = {}) {
    super();
    this.transport = new HttpInteractionsTransport(options);
  }

  protected async onStart(): Promise<void> {
    if (!this.app) return;
    await this.transport.listen((payload: any) => this.app!.getRouter().handleInteraction(payload));
  }

  protected async onStop(): Promise<void> {
    await this.transport.close();
  }
}
