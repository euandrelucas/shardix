import { ShardixApplication, ShardixOptions } from './shardix-application.js';

export class ShardixFactory {
  public static async create(options: ShardixOptions = {}): Promise<ShardixApplication> {
    return new ShardixApplication(options);
  }
}
