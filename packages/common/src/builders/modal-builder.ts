export interface TextInputData {
  type: 4;
  custom_id: string;
  label: string;
  style: 1 | 2;
  placeholder?: string;
  value?: string;
  required?: boolean;
  min_length?: number;
  max_length?: number;
}

export class TextInputBuilder {
  private data: TextInputData = {
    type: 4,
    custom_id: '',
    label: '',
    style: 1,
  };

  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  public setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  /** 1 = Short, 2 = Paragraph */
  public setStyle(style: 1 | 2): this {
    this.data.style = style;
    return this;
  }

  public setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  public setValue(value: string): this {
    this.data.value = value;
    return this;
  }

  public setRequired(required = true): this {
    this.data.required = required;
    return this;
  }

  public setMinLength(min: number): this {
    this.data.min_length = min;
    return this;
  }

  public setMaxLength(max: number): this {
    this.data.max_length = max;
    return this;
  }

  public toJSON(): TextInputData {
    return { ...this.data };
  }
}

export interface ModalActionRow {
  type: 1;
  components: TextInputData[];
}

export interface ModalData {
  title: string;
  custom_id: string;
  components: ModalActionRow[];
}

export class ModalBuilder {
  private data: ModalData = {
    title: '',
    custom_id: '',
    components: [],
  };

  public setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  public setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  /** Accepts TextInputBuilder instances or raw TextInputData objects */
  public addComponents(...components: (TextInputBuilder | TextInputData)[]): this {
    const row: ModalActionRow = {
      type: 1,
      components: components.map((c) => ('toJSON' in c ? c.toJSON() : c)),
    };
    this.data.components.push(row);
    return this;
  }

  public toJSON(): ModalData {
    return {
      ...this.data,
      components: this.data.components.map((row) => ({ ...row, components: [...row.components] })),
    };
  }
}
