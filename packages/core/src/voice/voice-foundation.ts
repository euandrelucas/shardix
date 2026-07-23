export interface VoiceState {
  guildId: string;
  channelId?: string;
  userId: string;
  session: string;
  deaf?: boolean;
  mute?: boolean;
}

export class AudioPlayer {
  private playing = false;

  public play(resource: any): void {
    this.playing = true;
  }

  public stop(): void {
    this.playing = false;
  }

  public isPlaying(): boolean {
    return this.playing;
  }
}

export class VoiceConnection {
  public readonly guildId: string;
  public readonly channelId: string;
  public readonly player = new AudioPlayer();

  constructor(guildId: string, channelId: string) {
    this.guildId = guildId;
    this.channelId = channelId;
  }

  public disconnect(): void {
    this.player.stop();
  }
}
