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

  public async login(token: string): Promise<void> {
    await this.client.login(token);
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
