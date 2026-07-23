import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface DiscordenoOptions {
  token?: string;
  botId?: bigint;
  [key: string]: any;
}

export class DiscordenoAdapter implements DiscordAdapter {
  public readonly name = 'DiscordenoAdapter';
  public readonly version = '0.4.0';
  private handler?: (interaction: any) => void | Promise<void>;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private isConnected = false;
  private clientMock = { id: 'discordeno_bot' };

  constructor(private options: DiscordenoOptions = {}) {}

  public getClient(): any {
    return this.clientMock;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || this.options.token || process.env.DISCORD_TOKEN;
    if (!finalToken) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[DiscordenoAdapter] Warning: No DISCORD_TOKEN provided. Gateway connection paused.');
      }
      return;
    }
    this.isConnected = true;
  }

  public async destroy(): Promise<void> {
    this.isConnected = false;
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.rawHandler = handler;
  }

  public async emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void> {
    // Response handler for Discordeno
  }

  public onInteractionCreate(handler: (interaction: any) => void | Promise<void>): void {
    this.handler = handler;
  }

  public emitInteraction(interaction: any): void {
    if (this.handler) {
      this.handler(interaction);
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}
