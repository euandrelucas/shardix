import dotenv from 'dotenv';
import { ProviderContract } from '@shardix/common';
import { ShardixUserConfig } from '@shardix/config';

export class ConfigProvider implements ProviderContract {
  public readonly name = 'ConfigProvider';
  public readonly version = '0.8.1';

  constructor(private userConfig?: ShardixUserConfig) {}

  public async register(app: { getContainer(): { register(p: unknown): void } }): Promise<void> {
    dotenv.config();
    const container = app.getContainer();
    container.register({
      provide: ConfigProvider,
      useValue: this,
    });
    // Also register user config object so it can be injected directly
    if (this.userConfig) {
      container.register({ provide: 'ShardixUserConfig', useValue: this.userConfig });
    }
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
