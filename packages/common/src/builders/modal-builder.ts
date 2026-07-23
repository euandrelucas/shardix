export class ModalBuilder {
  private data: any = {
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

  public addComponents(...components: any[]): this {
    for (const comp of components) {
      this.data.components.push({
        type: 1, // ActionRow
        components: [comp.toJSON ? comp.toJSON() : comp],
      });
    }
    return this;
  }

  public toJSON() {
    return this.data;
  }
}
