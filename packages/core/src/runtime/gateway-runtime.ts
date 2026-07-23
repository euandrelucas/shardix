import { BaseRuntime } from './runtime.js';
import { GatewayTransport } from '@shardix/transport';
import { DiscordAdapter } from '@shardix/common';

export interface GatewayRuntimeOptions {
  adapter: DiscordAdapter;
  token?: string;
}

export class GatewayRuntime extends BaseRuntime {
  public readonly name = 'GatewayRuntime';
  private transport: GatewayTransport;

  constructor(options: GatewayRuntimeOptions) {
    super();
    this.transport = new GatewayTransport(options);
  }

  protected async onStart(): Promise<void> {
    if (!this.app) return;
    await this.transport.listen((payload: any) => this.app!.getRouter().handleInteraction(payload));
  }

  protected async onStop(): Promise<void> {
    await this.transport.close();
  }
}
