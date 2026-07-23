import { BaseRuntime } from './runtime.js';
import { GatewayTransport } from '@shardix/transport';
import { DiscordAdapter } from '@shardix/common';

export interface GatewayRuntimeOptions {
  adapter?: DiscordAdapter;
  token?: string;
}

export class GatewayRuntime extends BaseRuntime {
  public readonly name = 'GatewayRuntime';
  private transport?: GatewayTransport;
  private options?: GatewayRuntimeOptions;

  constructor(options?: GatewayRuntimeOptions) {
    super();
    this.options = options;
  }

  protected async onStart(): Promise<void> {
    if (!this.app) return;
    const adapter = this.options?.adapter || this.app.getAdapter();
    if (adapter) {
      this.transport = new GatewayTransport({ adapter, token: this.options?.token });
      await this.transport.listen((payload: any) => this.app!.getRouter().handleInteraction(payload));
    }
  }

  protected async onStop(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
    }
  }
}
