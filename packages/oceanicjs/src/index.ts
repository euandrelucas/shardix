import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface OceanicClientOptions {
  auth?: string;
  [key: string]: any;
}

export class OceanicAdapter implements DiscordAdapter {
  public readonly name = 'OceanicAdapter';
  public readonly version = '0.4.0';
  private handler?: (interaction: any) => void | Promise<void>;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private isConnected = false;
  private clientMock = { id: 'oceanic_client' };

  constructor(private options: OceanicClientOptions = {}) {}

  public getClient(): any {
    return this.clientMock;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || this.options.auth;
    if (!finalToken && process.env.NODE_ENV !== 'test') {
      throw new Error('[OceanicAdapter] Auth token is required to connect Oceanic.js');
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
    // Response handler for Oceanic.js
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
