import dotenv from 'dotenv';
import { ProviderContract } from '@shardix/common';
import { ShardixUserConfig } from '@shardix/config';

export class ConfigProvider implements ProviderContract {
  public readonly name = 'ConfigProvider';
  public readonly version = '0.3.0';

  constructor(private userConfig?: ShardixUserConfig) {}

  public async register(app: any): Promise<void> {
    dotenv.config();
    const container = app.getContainer();
    container.register({
      provide: ConfigProvider,
      useValue: this,
    });
  }

  public get<T = any>(key: string, defaultValue?: T): T {
    if (process.env[key] !== undefined) {
      return process.env[key] as unknown as T;
    }
    if (this.userConfig && (this.userConfig as any)[key] !== undefined) {
      return (this.userConfig as any)[key];
    }
    return defaultValue as T;
  }
}
