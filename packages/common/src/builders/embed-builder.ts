export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

export interface EmbedFooter {
  text: string;
  icon_url?: string;
}

export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: EmbedFooter;
  image?: { url: string };
  thumbnail?: { url: string };
  author?: EmbedAuthor;
  fields?: EmbedField[];
}

export class EmbedBuilder {
  private data: EmbedData = {};

  public setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  public setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  public setUrl(url: string): this {
    this.data.url = url;
    return this;
  }

  public setTimestamp(timestamp: string | Date = new Date()): this {
    this.data.timestamp = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
    return this;
  }

  public setColor(color: number | string): this {
    if (typeof color === 'string') {
      this.data.color = parseInt(color.replace('#', ''), 16);
    } else {
      this.data.color = color;
    }
    return this;
  }

  public setFooter(footer: EmbedFooter): this {
    this.data.footer = footer;
    return this;
  }

  public setImage(url: string): this {
    this.data.image = { url };
    return this;
  }

  public setThumbnail(url: string): this {
    this.data.thumbnail = { url };
    return this;
  }

  public setAuthor(author: EmbedAuthor): this {
    this.data.author = author;
    return this;
  }

  public addField(name: string, value: string, inline = false): this {
    if (!this.data.fields) this.data.fields = [];
    this.data.fields.push({ name, value, inline });
    return this;
  }

  public toJSON(): EmbedData {
    return this.data;
  }
}
