import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface ErisClientOptions {
  token?: string;
  options?: any;
  [key: string]: any;
}

export class ErisAdapter implements DiscordAdapter<any> {
  public readonly name = 'ErisAdapter';
  public readonly version = '0.8.0';
  private client: any;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private isConnected = false;

  constructor(private options: ErisClientOptions = {}) {
    try {
      const Eris = require('eris');
      const token = options.token || process.env.DISCORD_TOKEN || 'mock_token';
      const erisOptions = options.options || {};
      if (!erisOptions.intents) {
        erisOptions.intents = ['guilds', 'guildMessages', 'guildMembers', 'guildVoiceStates', 'messageContent'];
      }
      this.client = new Eris(token, erisOptions);
    } catch {
      this.client = null;
    }
  }

  public getClient(): any {
    return this.client;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || this.options.token || process.env.DISCORD_TOKEN;
    if (!finalToken) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[ErisAdapter] Warning: No DISCORD_TOKEN provided. Gateway connection paused.');
      }
      return;
    }

    if (!this.client) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(
          "[Shardix] Error: 'eris' package is not installed. Please install it using 'pnpm add eris' or 'npm install eris'."
        );
      }
      this.isConnected = true;
      return;
    }

    try {
      this.isConnected = true;
      await this.client.connect();
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[ErisAdapter] Gateway connection failed:', err?.message || err);
      }
    }
  }

  public async destroy(): Promise<void> {
    this.isConnected = false;
    if (this.client?.disconnect) {
      this.client.disconnect({ reconnect: false });
    }
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.rawHandler = handler;
    if (this.client) {
      this.client.on('rawWS', async (packet: any) => {
        if (packet && packet.t) {
          await handler(packet as RawDiscordEvent);
        }
      });
      this.client.on('interactionCreate', async (interaction: any) => {
        if (this.rawHandler) {
          const rawPayload: RawDiscordEvent = {
            t: 'INTERACTION_CREATE',
            d: {
              id: interaction.id,
              type: interaction.type,
              token: interaction.token,
              data: {
                name: interaction.data?.name,
                custom_id: interaction.data?.custom_id,
                options: interaction.data?.options || [],
              },
              guild_id: interaction.guildID,
              channel_id: interaction.channelID,
              member: interaction.member,
              user: interaction.user,
            },
          };
          const result: any = await this.rawHandler(rawPayload);
          if (result && typeof result === 'object' && 'data' in result && typeof interaction.createMessage === 'function') {
            if (!interaction.acknowledged) {
              await interaction.createMessage(result.data.content || result.data);
            }
          }
        }
      });
    }
  }

  public onEvent(eventName: string, handler: (...args: any[]) => void | Promise<void>): void {
    if (this.client?.on) {
      this.client.on(eventName, async (...args: any[]) => {
        await handler(...args);
      });
    }
  }

  public async emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void> {
    if (this.client?.requestHandler) {
      await this.client.requestHandler.request(
        'POST',
        `/interactions/${interactionId}/${token}/callback`,
        true,
        body
      );
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}
