import { InteractionPayload } from '../interfaces/index.js';

export interface CommandResponseOptions {
  content?: string;
  embeds?: any[];
  components?: any[];
  files?: any[];
  flags?: number;
  ephemeral?: boolean;
  tts?: boolean;
  allowedMentions?: any;
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
  private _deferred = false;
  private _replied = false;
  private adapterRef?: any;
  private nativeInteraction?: any;

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
    // The adapter passes the native interaction via the payload's _nativeInteraction field
    this.nativeInteraction = (payload as any)._nativeInteraction;
  }

  /** Get a slash command option value by name */
  public getOption<T = any>(name: string): T | undefined {
    if (!this.raw.data || !this.raw.data.options) return undefined;
    const opt = this.raw.data.options.find((o: any) => o.name === name);
    return opt ? (opt.value as T) : undefined;
  }

  /** Get all options as a key-value map */
  public getOptions(): Record<string, any> {
    if (!this.raw.data?.options) return {};
    return Object.fromEntries(this.raw.data.options.map((o: any) => [o.name, o.value]));
  }

  /** Reply to the interaction */
  public async reply(options: string | CommandResponseOptions | any): Promise<any> {
    const payloadData = this._normalizeReplyOptions(options);

    if (this._deferred) {
      return await this.editReply(payloadData);
    }

    this._replied = true;

    // Use native interaction if available (adapter provided it)
    if (this.nativeInteraction && typeof this.nativeInteraction.reply === 'function') {
      if (!this.nativeInteraction.replied && !this.nativeInteraction.deferred) {
        await this.nativeInteraction.reply(payloadData);
        return;
      }
    }

    // Return structured response for the transport layer to send
    return { type: 4, data: payloadData };
  }

  /** Defer the interaction (shows loading state) */
  public async defer(ephemeral = false): Promise<any> {
    this._deferred = true;

    if (this.nativeInteraction && typeof this.nativeInteraction.deferReply === 'function') {
      if (!this.nativeInteraction.replied && !this.nativeInteraction.deferred) {
        await this.nativeInteraction.deferReply({ ephemeral });
        return;
      }
    }

    return { type: 5, data: { flags: ephemeral ? 64 : 0 } };
  }

  /** Edit the deferred or original reply */
  public async editReply(options: string | CommandResponseOptions | any): Promise<any> {
    const payloadData = this._normalizeReplyOptions(options);

    if (this.nativeInteraction) {
      if (typeof this.nativeInteraction.editReply === 'function') {
        return await this.nativeInteraction.editReply(payloadData);
      }
    }

    if (this.adapterRef && typeof this.adapterRef.emitInteractionResponse === 'function') {
      await this.adapterRef.emitInteractionResponse(this.id, this.token, {
        type: 7,
        data: payloadData,
      });
    }
    return { type: 7, data: payloadData };
  }

  /** Send a follow-up message after an initial reply */
  public async followUp(options: string | CommandResponseOptions | any): Promise<any> {
    const payloadData = this._normalizeReplyOptions(options);

    if (this.nativeInteraction && typeof this.nativeInteraction.followUp === 'function') {
      return await this.nativeInteraction.followUp(payloadData);
    }

    return { type: 4, data: payloadData };
  }

  /** Check if the interaction has been deferred */
  public isDeferred(): boolean {
    return this._deferred;
  }

  /** Check if the interaction has been replied to */
  public isReplied(): boolean {
    return this._replied || this._deferred;
  }

  /** Get the native interaction object (adapter-specific) */
  public getNativeInteraction<T = any>(): T | undefined {
    return this.nativeInteraction as T;
  }

  /** Wait for a button interaction */
  public async awaitButton(customId: string, timeout = 30000): Promise<CommandContext | null> {
    if (this.nativeInteraction && typeof this.nativeInteraction.channel?.awaitMessageComponent === 'function') {
      try {
        const { ComponentType } = require('discord.js');
        const collected = await this.nativeInteraction.channel.awaitMessageComponent({
          filter: (i: any) => i.customId === customId && i.user.id === this.user.id,
          componentType: ComponentType?.Button ?? 2,
          time: timeout,
        });
        return new CommandContext({
          ...this.raw,
          id: collected.id,
          token: collected.token,
          data: { custom_id: collected.customId },
          _nativeInteraction: collected,
        } as any, this.adapterRef);
      } catch {
        return null; // Timed out
      }
    }
    return null;
  }

  /** Wait for a modal submission */
  public async awaitModal(customId: string, timeout = 30000): Promise<CommandContext | null> {
    if (this.nativeInteraction && typeof this.nativeInteraction.awaitModalSubmit === 'function') {
      try {
        const collected = await this.nativeInteraction.awaitModalSubmit({
          filter: (i: any) => i.customId === customId,
          time: timeout,
        });
        return new CommandContext({
          ...this.raw,
          id: collected.id,
          token: collected.token,
          data: { custom_id: collected.customId, components: collected.components },
          _nativeInteraction: collected,
        } as any, this.adapterRef);
      } catch {
        return null;
      }
    }
    return null;
  }

  /** Wait for a select menu interaction */
  public async awaitSelect(customId: string, timeout = 30000): Promise<CommandContext | null> {
    if (this.nativeInteraction && typeof this.nativeInteraction.channel?.awaitMessageComponent === 'function') {
      try {
        const { ComponentType } = require('discord.js');
        const collected = await this.nativeInteraction.channel.awaitMessageComponent({
          filter: (i: any) => i.customId === customId && i.user.id === this.user.id,
          componentType: ComponentType?.StringSelect ?? 3,
          time: timeout,
        });
        return new CommandContext({
          ...this.raw,
          id: collected.id,
          token: collected.token,
          data: { custom_id: collected.customId, values: collected.values },
          _nativeInteraction: collected,
        } as any, this.adapterRef);
      } catch {
        return null;
      }
    }
    return null;
  }

  private _normalizeReplyOptions(options: string | CommandResponseOptions | any): any {
    if (typeof options === 'string') {
      return { content: options };
    }
    if (options && typeof options.toJSON === 'function') {
      return options.toJSON();
    }
    const result = { ...options };
    if (result.ephemeral) {
      result.flags = (result.flags || 0) | 64;
      delete result.ephemeral;
    }
    return result;
  }
}
