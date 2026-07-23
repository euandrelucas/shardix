export enum ComponentType {
  ActionRow = 1,
  Button = 2,
  StringSelect = 3,
  TextInput = 4,
  UserSelect = 5,
  RoleSelect = 6,
  MentionableSelect = 7,
  ChannelSelect = 8,
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: { name?: string; id?: string };
  default?: boolean;
}

export class SelectMenuBuilder {
  private data: any = {
    type: ComponentType.StringSelect,
    options: [],
  };

  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  public setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  public setMinValues(min: number): this {
    this.data.min_values = min;
    return this;
  }

  public setMaxValues(max: number): this {
    this.data.max_values = max;
    return this;
  }

  public setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  public addOptions(...options: SelectOption[]): this {
    this.data.options.push(...options);
    return this;
  }

  public toJSON() {
    return this.data;
  }
}
