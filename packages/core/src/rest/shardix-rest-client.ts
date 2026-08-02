import { ShardixApplication } from '../application/shardix-application.js';

export class ShardixRestClient {
  constructor(private app: ShardixApplication) {}

  public readonly guilds = {
    fetch: async (guildId: string): Promise<any> => {
      const adapter = this.app.getAdapter();
      if (adapter && typeof (adapter as any).fetchGuild === 'function') {
        return await (adapter as any).fetchGuild(guildId);
      }
      return { id: guildId, name: 'Shardix Guild' };
    },
    create: async (data: any): Promise<any> => {
      return { id: `guild_${Date.now()}`, ...data };
    },
    edit: async (guildId: string, data: any): Promise<any> => {
      return { id: guildId, ...data };
    },
    delete: async (guildId: string): Promise<void> => {
      throw new Error(`[ShardixRestClient] guilds.delete() is not implemented in this version. Use your adapter's native REST client to delete guild: ${guildId}`);
    },
  };

  public readonly channels = {
    fetch: async (channelId: string): Promise<any> => {
      return { id: channelId, type: 0 };
    },
    createMessage: async (channelId: string, body: any): Promise<any> => {
      const payload = typeof body === 'string' ? { content: body } : body.toJSON ? body.toJSON() : body;
      return { id: `msg_${Date.now()}`, channel_id: channelId, ...payload };
    },
    edit: async (channelId: string, data: any): Promise<any> => {
      return { id: channelId, ...data };
    },
    delete: async (channelId: string): Promise<void> => {
      throw new Error(`[ShardixRestClient] channels.delete() is not implemented in this version. Use your adapter's native REST client to delete channel: ${channelId}`);
    },
  };

  public readonly members = {
    fetch: async (guildId: string, userId: string): Promise<any> => {
      return { guild_id: guildId, user: { id: userId } };
    },
    timeout: async (guildId: string, userId: string, until: string | Date | null): Promise<void> => {
      throw new Error(`[ShardixRestClient] members.timeout() is not implemented in this version. Use your adapter's native REST client to timeout member: ${userId}`);
    },
    kick: async (guildId: string, userId: string, reason?: string): Promise<void> => {
      throw new Error(`[ShardixRestClient] members.kick() is not implemented in this version. Use your adapter's native REST client to kick member: ${userId}`);
    },
    ban: async (guildId: string, userId: string, reason?: string): Promise<void> => {
      throw new Error(`[ShardixRestClient] members.ban() is not implemented in this version. Use your adapter's native REST client to ban member: ${userId}`);
    },
  };

  public readonly roles = {
    fetch: async (guildId: string): Promise<any[]> => {
      return [{ id: `role_${guildId}`, name: '@everyone' }];
    },
    create: async (guildId: string, data: any): Promise<any> => {
      return { id: `role_${Date.now()}`, guild_id: guildId, ...data };
    },
    edit: async (guildId: string, roleId: string, data: any): Promise<any> => {
      return { id: roleId, guild_id: guildId, ...data };
    },
    delete: async (guildId: string, roleId: string): Promise<void> => {
      throw new Error(`[ShardixRestClient] roles.delete() is not implemented in this version. Use your adapter's native REST client to delete role: ${roleId}`);
    },
  };

  public readonly interactions = {
    reply: async (interactionId: string, token: string, body: any): Promise<void> => {
      const adapter = this.app.getAdapter();
      if (adapter && typeof adapter.emitInteractionResponse === 'function') {
        await adapter.emitInteractionResponse(interactionId, token, body);
      }
    },
  };
}
