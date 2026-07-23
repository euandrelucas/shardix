import { DiscordAdapter, InteractionHandler, Transport } from '@shardix/common';

export interface GatewayTransportOptions {
  adapter: DiscordAdapter;
  token?: string;
}

export class GatewayTransport implements Transport {
  public readonly name = 'GatewayTransport';
  private adapter: DiscordAdapter;
  private token?: string;

  constructor(options: GatewayTransportOptions) {
    this.adapter = options.adapter;
    this.token = options.token;
  }

  public async listen(handler: InteractionHandler): Promise<void> {
    this.adapter.registerRawHandler(async (event) => {
      // Opcode 0 = Dispatch
      if (event.t === 'INTERACTION_CREATE') {
        const response = await handler(event.d);
        if (response) {
          await this.adapter.emitInteractionResponse(event.d.id, event.d.token, response);
        }
      }
    });

    if (this.token) {
      await this.adapter.login(this.token);
    }
  }

  public async close(): Promise<void> {
    await this.adapter.destroy();
  }
}
