import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export class DiscordJSAdapter implements DiscordAdapter<any> {
  public readonly name = 'DiscordJSAdapter';
  private client: any;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;

  constructor(options: any = {}) {
    try {
      const { Client, GatewayIntentBits } = require('discord.js');
      const defaultIntents = options.intents || [
        GatewayIntentBits?.Guilds ?? 1,
        GatewayIntentBits?.GuildMessages ?? 512,
        GatewayIntentBits?.MessageContent ?? 32768,
        GatewayIntentBits?.GuildMembers ?? 2,
        GatewayIntentBits?.GuildVoiceStates ?? 128,
      ];
      this.client = new Client({
        intents: defaultIntents,
        ...options,
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
        console.warn('[DiscordJSAdapter] Warning: No DISCORD_TOKEN provided. Gateway connection paused.');
      }
      return;
    }

    if (!this.client) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(
          "[Shardix] Error: 'discord.js' module is not installed. Please install it using 'pnpm add discord.js' or 'npm install discord.js'."
        );
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
    if (this.client?.destroy) {
      await this.client.destroy();
    }
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.rawHandler = handler;
    if (this.client) {
      this.client.on('raw', async (data: any) => {
        if (data && data.t) {
          await handler(data as RawDiscordEvent);
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
                name: interaction.commandName,
                custom_id: interaction.customId,
                options: interaction.options?.data || [],
              },
              guild_id: interaction.guildId,
              channel_id: interaction.channelId,
              user: interaction.user ? { id: interaction.user.id, username: interaction.user.username } : undefined,
              member: interaction.member,
            },
          };

          const result: any = await this.rawHandler(rawPayload);
          if (result && typeof result === 'object' && 'data' in result && typeof interaction.reply === 'function') {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply(result.data.content || result.data);
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
    if (this.client?.rest) {
      await this.client.rest.post(`/interactions/${interactionId}/${token}/callback` as any, {
        body,
      });
    }
  }
}
