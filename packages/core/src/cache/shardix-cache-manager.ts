export class ShardixCacheManager {
  private guildsMap = new Map<string, any>();
  private channelsMap = new Map<string, any>();
  private usersMap = new Map<string, any>();
  private membersMap = new Map<string, any>();

  public guild(id: string): any | undefined {
    return this.guildsMap.get(id);
  }

  public setGuild(id: string, data: any): void {
    this.guildsMap.set(id, data);
  }

  public channel(id: string): any | undefined {
    return this.channelsMap.get(id);
  }

  public setChannel(id: string, data: any): void {
    this.channelsMap.set(id, data);
  }

  public user(id: string): any | undefined {
    return this.usersMap.get(id);
  }

  public setUser(id: string, data: any): void {
    this.usersMap.set(id, data);
  }

  public member(guildId: string, userId: string): any | undefined {
    return this.membersMap.get(`${guildId}:${userId}`);
  }

  public setMember(guildId: string, userId: string, data: any): void {
    this.membersMap.set(`${guildId}:${userId}`, data);
  }

  public clear(): void {
    this.guildsMap.clear();
    this.channelsMap.clear();
    this.usersMap.clear();
    this.membersMap.clear();
  }
}
