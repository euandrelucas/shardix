import { DiscordAdapter, RawDiscordEvent } from '@shardix/common';

export interface DiscordJSAdapterOptions {
  intents?: number[];
  registerCommands?: boolean;
  [key: string]: any;
}

export class DiscordJSAdapter implements DiscordAdapter<any> {
  public readonly name = 'DiscordJSAdapter';
  private client: any;
  private rawHandler?: (event: RawDiscordEvent) => any | Promise<any>;
  private pendingInteractions = new Map<string, any>();

  constructor(private options: DiscordJSAdapterOptions = {}) {
    try {
      const { Client, GatewayIntentBits } = require('discord.js');
      const defaultIntents = options.intents || [
        GatewayIntentBits?.Guilds ?? 1,
        GatewayIntentBits?.GuildMessages ?? 512,
        GatewayIntentBits?.MessageContent ?? 32768,
        GatewayIntentBits?.GuildMembers ?? 2,
        GatewayIntentBits?.GuildVoiceStates ?? 128,
      ];

      // Remove adapter-specific options before passing to discord.js Client
      const { registerCommands, ...clientOptions } = options;
      this.client = new Client({
        intents: defaultIntents,
        ...clientOptions,
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
          "[Shardix] Error: 'discord.js' module is not installed. Please install it using 'npm install discord.js'."
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

  public registerRawHandler(handler: (event: RawDiscordEvent) => any): void {
    this.rawHandler = handler;
    if (!this.client) return;

    // Forward raw WS events
    this.client.on('raw', async (data: any) => {
      if (data && data.t && data.t !== 'INTERACTION_CREATE') {
        await handler(data as RawDiscordEvent);
      }
    });

    // Handle interactions with native objects for proper reply support
    this.client.on('interactionCreate', async (interaction: any) => {
      if (!this.rawHandler) return;

      // Store native interaction for reply support
      this.pendingInteractions.set(interaction.id, interaction);

      const rawPayload: RawDiscordEvent = {
        t: 'INTERACTION_CREATE',
        d: {
          id: interaction.id,
          type: interaction.type,
          token: interaction.token,
          data: {
            name: interaction.commandName ?? interaction.data?.name,
            custom_id: interaction.customId ?? interaction.data?.custom_id,
            options: interaction.options?.data || interaction.data?.options || [],
            component_type: interaction.componentType,
          },
          guild_id: interaction.guildId,
          channel_id: interaction.channelId,
          locale: interaction.locale,
          user: interaction.user
            ? { id: interaction.user.id, username: interaction.user.username, discriminator: interaction.user.discriminator }
            : undefined,
          member: interaction.member
            ? {
                user: { id: interaction.member.id || interaction.user?.id, username: interaction.member.user?.username || interaction.user?.username },
                roles: interaction.member.roles?.cache?.map((r: any) => r.id) || [],
                permissions: interaction.memberPermissions?.bitfield?.toString(),
              }
            : undefined,
          // Attach native interaction reference for CommandContext
          _nativeInteraction: interaction,
        },
      };

      try {
        const result = await this.rawHandler(rawPayload);

        // If the handler returned a response object and interaction hasn't been replied to
        if (result && typeof result === 'object' && 'data' in result) {
          if (!interaction.replied && !interaction.deferred) {
            const replyData = result.data;
            if (result.type === 5) {
              // Deferred response
              await interaction.deferReply({ ephemeral: !!(replyData?.flags && replyData.flags & 64) });
            } else {
              // Immediate reply
              await interaction.reply({
                content: typeof replyData === 'string' ? replyData : replyData?.content,
                embeds: replyData?.embeds,
                components: replyData?.components,
                ephemeral: !!(replyData?.flags && replyData.flags & 64),
              });
            }
          }
        }
      } catch (err: any) {
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({ content: 'An error occurred while processing this interaction.', ephemeral: true });
          } catch {}
        }
        console.error('[DiscordJSAdapter] Error handling interaction:', err?.message || err);
      } finally {
        this.pendingInteractions.delete(interaction.id);
      }
    });
  }

  public onEvent(eventName: string, handler: (...args: any[]) => void | Promise<void>): void {
    if (this.client?.on) {
      this.client.on(eventName, async (...args: any[]) => {
        await handler(...args);
      });
    }
  }

  public async emitInteractionResponse(interactionId: string, token: string, body: any): Promise<void> {
    // First try to use the native interaction object if available
    const interaction = this.pendingInteractions.get(interactionId);
    if (interaction) {
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: typeof body === 'string' ? body : body?.content,
            embeds: body?.embeds,
            components: body?.components,
            ephemeral: !!(body?.flags && body.flags & 64),
          });
        } else {
          await interaction.editReply({
            content: typeof body === 'string' ? body : body?.content,
            embeds: body?.embeds,
            components: body?.components,
          });
        }
        return;
      } catch {}
    }
    // Fallback to REST API
    if (this.client?.rest) {
      await this.client.rest.post(`/interactions/${interactionId}/${token}/callback` as any, { body });
    }
  }

  /**
   * Registers slash commands with Discord API.
   * Call this after login to register global or guild commands.
   */
  public async registerSlashCommands(commands: any[], guildId?: string): Promise<void> {
    if (!this.client) return;
    await new Promise<void>((resolve) => {
      if (this.client.isReady()) {
        resolve();
      } else {
        this.client.once('ready', () => resolve());
      }
    });

    const { REST, Routes } = require('discord.js');
    const token = process.env.DISCORD_TOKEN;
    if (!token) return;

    const rest = new REST({ version: '10' }).setToken(token);
    const clientId = this.client.user?.id;
    if (!clientId) return;

    try {
      if (guildId) {
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
        console.log(`[Shardix] Registered ${commands.length} guild slash commands in ${guildId}`);
      } else {
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log(`[Shardix] Registered ${commands.length} global slash commands`);
      }
    } catch (err: any) {
      console.error('[Shardix] Failed to register slash commands:', err?.message || err);
    }
  }
}
