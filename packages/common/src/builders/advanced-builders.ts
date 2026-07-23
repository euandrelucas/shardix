export class ActionRowBuilder {
  private components: any[] = [];

  public addComponents(...components: any[]): this {
    for (const c of components) {
      this.components.push(c.toJSON ? c.toJSON() : c);
    }
    return this;
  }

  public toJSON() {
    return {
      type: 1, // ActionRow
      components: this.components,
    };
  }
}

export class AttachmentBuilder {
  private name: string;
  private description?: string;

  constructor(fileInput: any, options: { name?: string; description?: string } = {}) {
    this.name = options.name || 'file.png';
    this.description = options.description;
  }

  public setName(name: string): this {
    this.name = name;
    return this;
  }

  public setDescription(description: string): this {
    this.description = description;
    return this;
  }

  public toJSON() {
    return {
      id: 0,
      filename: this.name,
      description: this.description,
    };
  }
}

export class SlashCommandBuilder {
  private data: any = {
    name: '',
    description: '',
    options: [],
  };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  public addStringOption(fn: (option: any) => any): this {
    const opt = { type: 3, name: '', description: '', required: false };
    fn(opt);
    this.data.options.push(opt);
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class ContextMenuBuilder {
  private data: any = {
    name: '',
    type: 2, // User or Message
  };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public setType(type: 2 | 3): this {
    this.data.type = type;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class ThreadBuilder {
  private data: any = {
    name: '',
    auto_archive_duration: 1440,
  };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public setAutoArchiveDuration(minutes: number): this {
    this.data.auto_archive_duration = minutes;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class RoleBuilder {
  private data: any = {
    name: 'new role',
    color: 0,
    hoist: false,
    mentionable: false,
  };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public setColor(color: number): this {
    this.data.color = color;
    return this;
  }

  public setHoist(hoist = true): this {
    this.data.hoist = hoist;
    return this;
  }

  public setMentionable(mentionable = true): this {
    this.data.mentionable = mentionable;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class EmojiBuilder {
  private data: any = { name: '' };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class StickerBuilder {
  private data: any = { name: '', description: '', tags: '' };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  public setTags(tags: string): this {
    this.data.tags = tags;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class ActivityBuilder {
  private data: any = { name: '', type: 0 };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public setType(type: number): this {
    this.data.type = type;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class WebhookBuilder {
  private data: any = { name: '' };

  public setName(name: string): this {
    this.data.name = name;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}

export class PermissionBuilder {
  private bitfield: bigint = 0n;

  public add(...permissions: bigint[]): this {
    for (const p of permissions) {
      this.bitfield |= p;
    }
    return this;
  }

  public remove(...permissions: bigint[]): this {
    for (const p of permissions) {
      this.bitfield &= ~p;
    }
    return this;
  }

  public toString(): string {
    return this.bitfield.toString();
  }
}
