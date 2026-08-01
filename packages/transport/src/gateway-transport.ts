import { DiscordAdapter, InteractionHandler, Transport } from '@shardix/common';

export interface GatewayTransportOptions {
  adapter: DiscordAdapter;
  token?: string;
}

export class GatewayTransport implements Transport {
  public readonly name = 'GatewayTransport';
  private adapter: DiscordAdapter;
  private token?: string;
  private loggedIn = false;

  constructor(options: GatewayTransportOptions) {
    this.adapter = options.adapter;
    this.token = options.token;
  }

  public async listen(handler: InteractionHandler): Promise<void> {
    // Register the interaction handler via raw event forwarding
    this.adapter.registerRawHandler(async (event) => {
      if (event.t === 'INTERACTION_CREATE') {
        // The handler (router) processes the interaction; adapter handles the reply natively
        await handler(event.d);
      }
    });

    // Login using the token if provided, or rely on DISCORD_TOKEN env var
    if (!this.loggedIn) {
      this.loggedIn = true;
      const token = this.token || process.env.DISCORD_TOKEN;
      if (token && process.env.NODE_ENV !== 'test') {
        await this.adapter.login(token);
      }
    }
  }

  public async close(): Promise<void> {
    await this.adapter.destroy();
  }
}
