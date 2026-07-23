import { ProviderContract } from '@shardix/common';
import { Logger, LoggerOptions } from '@shardix/logger';

export class LoggerProvider implements ProviderContract {
  public readonly name = 'LoggerProvider';
  public readonly version = '0.3.0';
  private logger: Logger;

  constructor(options: LoggerOptions = {}) {
    this.logger = new Logger(options);
  }

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: Logger,
      useValue: this.logger,
    });
    container.register({
      provide: LoggerProvider,
      useValue: this,
    });
  }

  public getLogger(): Logger {
    return this.logger;
  }
}
