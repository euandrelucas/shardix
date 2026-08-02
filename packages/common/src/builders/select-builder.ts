import { ComponentType } from './component-type.js';

export { ComponentType };

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
  emoji?: { name?: string; id?: string };
  default?: boolean;
}

export interface SelectMenuData {
  type: ComponentType;
  custom_id: string;
  placeholder?: string;
  min_values?: number;
  max_values?: number;
  disabled?: boolean;
  options: SelectOption[];
}

export class SelectMenuBuilder {
  private data: SelectMenuData = {
    type: ComponentType.StringSelect,
    custom_id: '',
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

  public setOptions(options: SelectOption[]): this {
    this.data.options = options;
    return this;
  }

  public setType(type: ComponentType): this {
    this.data.type = type;
    return this;
  }

  public toJSON(): SelectMenuData {
    return { ...this.data, options: [...this.data.options] };
  }
}
