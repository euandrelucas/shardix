import { Runtime as IRuntime } from '@shardix/common';
import type { ShardixApplication } from '../application/shardix-application.js';

export abstract class BaseRuntime implements IRuntime {
  public abstract readonly name: string;
  protected app?: ShardixApplication;

  public async start(app: ShardixApplication): Promise<void> {
    this.app = app;
    await this.onStart();
  }

  public async stop(): Promise<void> {
    await this.onStop();
  }

  protected abstract onStart(): Promise<void>;
  protected abstract onStop(): Promise<void>;
}
