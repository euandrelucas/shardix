export interface PresenceOptions {
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  activities?: Array<{ name: string; type?: number; url?: string }>;
  afk?: boolean;
}

export class PresenceManager {
  private currentPresence: PresenceOptions = {
    status: 'online',
    activities: [],
    afk: false,
  };

  public set(options: PresenceOptions): void {
    this.currentPresence = {
      ...this.currentPresence,
      ...options,
    };
  }

  public getPresence(): PresenceOptions {
    return this.currentPresence;
  }
}
