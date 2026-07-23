export enum ButtonStyle {
  Primary = 1,
  Secondary = 2,
  Success = 3,
  Danger = 4,
  Link = 5,
}

export interface ButtonData {
  type: 2;
  style: ButtonStyle;
  label?: string;
  emoji?: { name?: string; id?: string; animated?: boolean };
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export class ButtonBuilder {
  private data: ButtonData = {
    type: 2,
    style: ButtonStyle.Primary,
  };

  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  public setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  public setStyle(style: ButtonStyle): this {
    this.data.style = style;
    return this;
  }

  public setUrl(url: string): this {
    this.data.url = url;
    this.data.style = ButtonStyle.Link;
    return this;
  }

  public setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  public setEmoji(emoji: { name?: string; id?: string; animated?: boolean }): this {
    this.data.emoji = emoji;
    return this;
  }

  public toJSON(): ButtonData {
    return this.data;
  }
}
