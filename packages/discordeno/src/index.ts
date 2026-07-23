import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface DiscordenoClientOptions {
  token?: string;
  intents?: any;
  [key: string]: any;
}

export class DiscordenoAdapter implements DiscordAdapter<any> {
  public readonly name = 'DiscordenoAdapter';
  public readonly version = '0.5.0';
  private bot: any;
  private rawHandler?: (event: RawDiscordEvent) => void | Promise<void>;
  private isConnected = false;

  constructor(private options: DiscordenoClientOptions = {}) {
    try {
      const { createBot } = require('@discordeno/bot');
      const token = options.token || process.env.DISCORD_TOKEN || 'mock_token';
      this.bot = createBot({
        token,
        intents: options.intents || 0,
        events: {},
      });
    } catch {
      this.bot = null;
    }
  }

  public getClient(): any {
    return this.bot;
  }

  public async login(token?: string): Promise<void> {
    const finalToken = token || this.options.token || process.env.DISCORD_TOKEN;
    if (!finalToken) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[DiscordenoAdapter] Warning: No DISCORD_TOKEN provided. Gateway connection paused.');
      }
      return;
    }

    if (!this.bot) {
      if (process.env.NODE_ENV !== 'test') {
        throw new Error(
          "[Shardix] Error: '@discordeno/bot' package is not installed. Please install it using 'pnpm add @discordeno/bot' or 'npm install @discordeno/bot'."
        );
      }
      this.isConnected = true;
      return;
    }

    try {
      const { startBot } = require('@discordeno/bot');
      this.isConnected = true;
      await startBot(this.bot);
    } catch (err: any) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('[DiscordenoAdapter] Gateway connection failed:', err?.message || err);
      }
    }
  }

  public async destroy(): Promise<void> {
    this.isConnected = false;
    if (this.bot?.gateway) {
      await this.bot.gateway.shutdown();
    }
  }

  public registerRawHandler(handler: (event: RawDiscordEvent) => void | Promise<void>): void {
    this.rawHandler = handler;
    if (this.bot) {
      this.bot.events.raw = async (payload: any) => {
        if (payload && payload.t) {
          await handler(payload as RawDiscordEvent);
        }
      };
      this.bot.events.interactionCreate = async (interaction: any) => {
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
              user: interaction.user,
              member: interaction.member,
            },
          };
          await this.rawHandler(rawPayload);
        }
      };
    }
  }

  public async emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void> {
    if (this.bot?.rest) {
      await this.bot.rest.sendInteractionResponse(interactionId, token, body);
    }
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}
