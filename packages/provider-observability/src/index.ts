import { ProviderContract } from '@shardix/common';

export interface ObservabilityMetrics {
  totalCommandsExecuted: number;
  totalErrorsEncountered: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
}

export class ObservabilityService {
  private commandCounter = 0;
  private errorCounter = 0;
  private startTime = Date.now();

  public recordCommand(): void {
    this.commandCounter++;
  }

  public recordError(): void {
    this.errorCounter++;
  }

  public getMetrics(): ObservabilityMetrics {
    return {
      totalCommandsExecuted: this.commandCounter,
      totalErrorsEncountered: this.errorCounter,
      memoryUsageMB: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}

export class ObservabilityProvider implements ProviderContract {
  public readonly name = 'ObservabilityProvider';
  public readonly version = '0.4.0';
  private service = new ObservabilityService();

  public async register(app: any): Promise<void> {
    const container = app.getContainer();
    container.register({
      provide: ObservabilityService,
      useValue: this.service,
    });
    container.register({
      provide: ObservabilityProvider,
      useValue: this,
    });
  }

  public getService(): ObservabilityService {
    return this.service;
  }
}
