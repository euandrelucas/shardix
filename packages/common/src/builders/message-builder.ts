export class MessageBuilder {
  private data: any = {
    content: '',
    embeds: [],
    components: [],
    flags: 0,
  };

  public setContent(content: string): this {
    this.data.content = content;
    return this;
  }

  public addEmbeds(...embeds: any[]): this {
    for (const emb of embeds) {
      this.data.embeds.push(emb.toJSON ? emb.toJSON() : emb);
    }
    return this;
  }

  public addComponents(...components: any[]): this {
    const rowComponents = components.map((c) => (c.toJSON ? c.toJSON() : c));
    this.data.components.push({
      type: 1, // ActionRow
      components: rowComponents,
    });
    return this;
  }

  public setEphemeral(ephemeral = true): this {
    if (ephemeral) {
      this.data.flags |= 64;
    } else {
      this.data.flags &= ~64;
    }
    return this;
  }

  public toJSON() {
    return this.data;
  }
}
