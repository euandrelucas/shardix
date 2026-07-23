import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface ErisClientOptions {
  token?: string;
  [key: string]: any;
}

export class ErisAdapter implements DiscordAdapter {
  public readonly name = 'ErisAdapter';
  public readonly version = '0.4.0';
  private handler?: (interaction: any) => void | Promise<void>;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private isConnected = false;
  private clientMock = { id: 'eris_client' };

  constructor(private options: ErisClientOptions = {}) {}

  public getClient(): any {
    return this.clientMock;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || this.options.token;
    if (!finalToken && process.env.NODE_ENV !== 'test') {
      throw new Error('[ErisAdapter] Token is required to login to Eris');
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
    // Response handler for Eris
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
