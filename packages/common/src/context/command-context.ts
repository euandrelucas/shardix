import { InteractionPayload } from '../interfaces/index.js';

export interface CommandResponseOptions {
  content?: string;
  embeds?: any[];
  components?: any[];
  flags?: number;
  ephemeral?: boolean;
}

export class CommandContext {
  public readonly raw: InteractionPayload;
  public readonly id: string;
  public readonly token: string;
  public readonly guildId?: string;
  public readonly channelId?: string;
  public readonly user: { id: string; username: string; discriminator?: string; avatar?: string };
  public readonly member?: { id: string; roles: string[]; permissions?: string };
  public readonly guild?: { id: string; name?: string };
  public readonly channel?: { id: string; name?: string };
  public readonly locale?: string;
  private deferred = false;
  private adapterRef?: any;

  constructor(payload: InteractionPayload, adapterRef?: any) {
    this.raw = payload;
    this.id = payload.id;
    this.token = payload.token;
    this.guildId = payload.guild_id;
    this.channelId = payload.channel_id;
    this.user = payload.user || payload.member?.user || { id: 'unknown', username: 'UnknownUser' };
    this.member = payload.member
      ? { id: payload.member.user?.id || this.user.id, roles: payload.member.roles || [], permissions: payload.member.permissions }
      : undefined;
    this.guild = this.guildId ? { id: this.guildId } : undefined;
    this.channel = this.channelId ? { id: this.channelId } : undefined;
    this.locale = payload.locale;
    this.adapterRef = adapterRef;
  }

  public getOption<T = any>(name: string): T | undefined {
    if (!this.raw.data || !this.raw.data.options) return undefined;
    const opt = this.raw.data.options.find((o: any) => o.name === name);
    return opt ? (opt.value as T) : undefined;
  }

  public async reply(options: string | CommandResponseOptions | any): Promise<any> {
    const payloadData = typeof options === 'string' ? { content: options } : options.toJSON ? options.toJSON() : options;
    if (typeof options === 'object' && options.ephemeral) {
      payloadData.flags = (payloadData.flags || 0) | 64;
    }

    if (this.deferred) {
      return await this.editReply(payloadData);
    }

    return {
      type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
      data: payloadData,
    };
  }

  public async defer(ephemeral = false): Promise<any> {
    this.deferred = true;
    return {
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: { flags: ephemeral ? 64 : 0 },
    };
  }

  public async editReply(options: string | CommandResponseOptions | any): Promise<any> {
    const payloadData = typeof options === 'string' ? { content: options } : options.toJSON ? options.toJSON() : options;
    if (this.adapterRef && typeof this.adapterRef.emitInteractionResponse === 'function') {
      await this.adapterRef.emitInteractionResponse(this.id, this.token, payloadData);
    }
    return { type: 4, data: payloadData };
  }

  public async followUp(options: string | CommandResponseOptions | any): Promise<any> {
    const payloadData = typeof options === 'string' ? { content: options } : options.toJSON ? options.toJSON() : options;
    return { type: 4, data: payloadData };
  }

  public isDeferred(): boolean {
    return this.deferred;
  }

  public async awaitButton(customId: string, timeout = 30000): Promise<any> {
    return { customId, user: this.user, timestamp: Date.now() };
  }

  public async awaitModal(customId: string, timeout = 30000): Promise<any> {
    return { customId, user: this.user, timestamp: Date.now() };
  }

  public async awaitSelect(customId: string, timeout = 30000): Promise<any> {
    return { customId, user: this.user, timestamp: Date.now() };
  }
}
