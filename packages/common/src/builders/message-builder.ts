import type { EmbedData } from './embed-builder.js';

export interface AllowedMentions {
  parse?: ('roles' | 'users' | 'everyone')[];
  roles?: string[];
  users?: string[];
  replied_user?: boolean;
}

export interface MessageData {
  content?: string;
  embeds?: EmbedData[];
  components?: unknown[];
  flags?: number;
  tts?: boolean;
  allowed_mentions?: AllowedMentions;
}

export class MessageBuilder {
  private data: MessageData = {
    content: '',
    embeds: [],
    components: [],
    flags: 0,
  };

  public setContent(content: string): this {
    this.data.content = content;
    return this;
  }

  public addEmbeds(...embeds: (EmbedData | { toJSON(): EmbedData })[]): this {
    if (!this.data.embeds) this.data.embeds = [];
    for (const emb of embeds) {
      this.data.embeds.push('toJSON' in emb ? emb.toJSON() : emb);
    }
    return this;
  }

  public addComponents(...components: ({ toJSON(): unknown } | unknown)[]): this {
    if (!this.data.components) this.data.components = [];
    const rowComponents = components.map((c) =>
      c !== null && typeof c === 'object' && 'toJSON' in c ? (c as { toJSON(): unknown }).toJSON() : c
    );
    this.data.components.push({
      type: 1, // ActionRow
      components: rowComponents,
    });
    return this;
  }

  public setEphemeral(ephemeral = true): this {
    if (ephemeral) {
      this.data.flags = (this.data.flags ?? 0) | 64;
    } else {
      this.data.flags = (this.data.flags ?? 0) & ~64;
    }
    return this;
  }

  public setTTS(tts = true): this {
    this.data.tts = tts;
    return this;
  }

  public setAllowedMentions(allowedMentions: AllowedMentions): this {
    this.data.allowed_mentions = allowedMentions;
    return this;
  }

  public toJSON(): MessageData {
    return { ...this.data };
  }
}
