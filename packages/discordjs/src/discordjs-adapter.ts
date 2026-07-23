import { Client, ClientOptions } from 'discord.js';
import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export class DiscordJSAdapter implements DiscordAdapter<Client> {
  public readonly name = 'DiscordJSAdapter';
  private client: Client;

  constructor(options: ClientOptions = { intents: [] }) {
    this.client = new Client(options);
  }

  public getClient(): Client {
    return this.client;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || process.env.DISCORD_TOKEN;
    if (!finalToken) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[DiscordJSAdapter] Warning: No DISCORD_TOKEN provided. Gateway connection paused.');
      }
      return;
    }
    try {
      await this.client.login(finalToken);
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[DiscordJSAdapter] Gateway login failed:', err.message);
      }
    }
  }

  public async destroy(): Promise<void> {
    await this.client.destroy();
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.client.on('raw', async (data: any) => {
      await handler(data as RawDiscordEvent);
    });
  }

  public async emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void> {
    if (this.client.rest) {
      await this.client.rest.post(`/interactions/${interactionId}/${token}/callback` as any, {
        body,
      });
    }
  }
}
