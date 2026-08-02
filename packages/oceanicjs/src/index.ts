import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface OceanicClientOptions {
  auth?: string;
  gateway?: any;
  [key: string]: any;
}

/**
 * Oceanic.js adapter for Shardix.
 *
 * @experimental This adapter is in active development. Some features may be incomplete.
 * For full feature support, use the discord.js adapter (@shardix/discordjs).
 */
export class OceanicAdapter implements DiscordAdapter<any> {
  public readonly name = 'OceanicAdapter';
  public readonly version = '0.8.1';
  private client: any;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private isConnected = false;

  constructor(private options: OceanicClientOptions = {}) {
    try {
      const { Client } = require('oceanic.js');
      const auth = options.auth || (process.env.DISCORD_TOKEN ? `Bot ${process.env.DISCORD_TOKEN}` : undefined);
      const gatewayOptions = options.gateway || {};
      if (!gatewayOptions.intents) {
        gatewayOptions.intents = ['GUILDS', 'GUILD_MESSAGES', 'GUILD_MEMBERS', 'GUILD_VOICE_STATES', 'MESSAGE_CONTENT'];
      }
      this.client = new Client({
        auth,
        gateway: gatewayOptions,
      });
    } catch {
      this.client = null;
    }
  }

  public getClient(): any {
    return this.client;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || process.env.DISCORD_TOKEN;
    if (!finalToken) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[OceanicAdapter] Warning: No DISCORD_TOKEN provided. Gateway connection paused.');
      }
      return;
    }

    if (!this.client) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(
          "[Shardix] Error: 'oceanic.js' package is not installed. Please install it using 'pnpm add oceanic.js' or 'npm install oceanic.js'."
        );
      }
      // Do not mark as connected when library is unavailable
      return;
    }

    try {
      this.isConnected = true;
      await this.client.connect();
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[OceanicAdapter] Gateway connection failed:', err?.message || err);
      }
    }
  }

  public async destroy(): Promise<void> {
    this.isConnected = false;
    if (this.client?.disconnect) {
      this.client.disconnect();
    }
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.rawHandler = handler;
    if (this.client) {
      this.client.on('packet', async (packet: any) => {
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
                custom_id: interaction.data?.customID || interaction.data?.custom_id,
                options: interaction.data?.options || [],
              },
              guild_id: interaction.guildID,
              channel_id: interaction.channelID,
              user: interaction.user,
              member: interaction.member,
            },
          };
          const result: any = await this.rawHandler(rawPayload);
          if (result && typeof result === 'object' && 'data' in result) {
            const responseData = result.data as Record<string, unknown>;
            if (!interaction.acknowledged) {
              if (typeof interaction.createMessage === 'function') {
                await interaction.createMessage({
                  content: responseData?.content,
                  embeds: responseData?.embeds,
                  components: responseData?.components,
                  flags: responseData?.flags,
                });
              } else if (typeof interaction.respond === 'function') {
                await interaction.respond(responseData.content || responseData);
              }
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
    if (this.client?.rest?.interactions) {
      await this.client.rest.interactions.createInteractionResponse(interactionId, token, body);
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}
