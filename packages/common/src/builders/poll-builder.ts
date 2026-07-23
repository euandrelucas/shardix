export interface PollAnswer {
  text: string;
  emoji?: { name?: string; id?: string };
}

export class PollBuilder {
  private data: any = {
    question: { text: '' },
    answers: [],
    duration: 24,
    allow_multiselect: false,
  };

  public setQuestion(question: string): this {
    this.data.question = { text: question };
    return this;
  }

  public addAnswer(answer: PollAnswer): this {
    this.data.answers.push({ poll_media: { text: answer.text, emoji: answer.emoji } });
    return this;
  }

  public setDuration(hours: number): this {
    this.data.duration = hours;
    return this;
  }

  public setAllowMultiselect(allow = true): this {
    this.data.allow_multiselect = allow;
    return this;
  }

  public toJSON() {
    return this.data;
  }
}
