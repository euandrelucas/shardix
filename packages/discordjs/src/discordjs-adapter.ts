import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export class DiscordJSAdapter implements DiscordAdapter<any> {
  public readonly name = 'DiscordJSAdapter';
  private client: any;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;

  constructor(options: any = { intents: [] }) {
    try {
      // Dynamic require/import to prevent hard crash if discord.js is not present
      const { Client } = require('discord.js');
      this.client = new Client(options);
    } catch {
      // Fallback mock for testing or when discord.js is externalized
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
        await handler(data as RawDiscordEvent);
      });
      this.client.on('interactionCreate', async (interaction: any) => {
        if (this.rawHandler) {
          const rawPayload: RawDiscordEvent = {
            t: 'INTERACTION_CREATE',
            d: {
              id: interaction.id,
              type: interaction.type,
              token: interaction.token,
              data: interaction.data,
              guild_id: interaction.guildId,
              channel_id: interaction.channelId,
              user: interaction.user ? { id: interaction.user.id, username: interaction.user.username } : undefined,
              member: interaction.member,
            },
          };
          await this.rawHandler(rawPayload);
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
